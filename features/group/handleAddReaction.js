const { constructEmbed } = require("./helpers");
const { fetchMessageCache, addToCache } = require("./cache");
const groupSchema = require("../../models/group");
const groupStatus = require("../../constants/groupStatus");

const handleAddReaction = async (reaction, user) => {
    if (user.bot) {
        console.log("Reaction added by a bot, stop handling");
        return;
    }

    const { message } = reaction;
    const { guild } = message;

    const [fetchedMessage, title, size, members] = fetchMessageCache(guild.id, message.id);
    if (!fetchedMessage) {
        console.log("Unable to retrieve message from cache");
        return;
    }

    if (fetchedMessage.id === message.id) {
        const guildMember = await guild.member(user.id);
        const { displayName, id } = guildMember;
        const currentMembers = Object.keys(members);

        const newMembers = { ...members };
        let statusToAdd;

        if (!currentMembers.includes(id)) {
            console.log("Reaction isn't already present, continuing");
            let confirmedCount = 0;
            for (const member in members) {
                if (members[member].status === groupStatus.CONFIRMED) {
                    confirmedCount++;
                }
            }

            if (reaction.emoji.name === "👍") {
                if (confirmedCount < size) {
                    statusToAdd = groupStatus.CONFIRMED;
                } else {
                    statusToAdd = groupStatus.WAITING;

                }
            } else if (reaction.emoji.name === "❓") {
                statusToAdd = groupStatus.UNKNOWN;
            } else {
                console.log("Something went wrong during emoji evaluation in groups");
            }


            newMembers[id] = { status: statusToAdd, displayName };
        } else {
            return;
        }

        const newEmbed = constructEmbed(newMembers, title, size);
        fetchedMessage.edit(newEmbed).then(async newMessage => {
            await addToCache(guild.id, newMessage, title, size, id, statusToAdd, displayName);

            const obj = {
                guildId: guild.id,
                channelId: message.channel.id,
                messageId: newMessage.id,
                title,
                size
            };

            await groupSchema.findOneAndUpdate(obj, {
                ...obj,
                $addToSet: {
                    members: [
                        {
                            status: statusToAdd,
                            id,
                            displayName
                        }
                    ]
                }
            }, {
                upsert: true
            });
        });
    } else {
        console.log("Fetched messageID did not match messageID");
        console.log(fetchedMessage.id, message.id);
    }
}

module.exports = {
    handleAddReaction
};