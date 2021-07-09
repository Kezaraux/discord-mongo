const { constructEmbed } = require("./helpers");
const { fetchMessageCache, removeMemberFromCache } = require("./cache");
const groupSchema = require("../../models/group");
const groupStatus = require("../../constants/groupStatus");

const handleRemoveReaction = async (reaction, user) => {
    if (user.bot) {
        console.log("Reaction removed by a bot, stop handling");
        return;
    }

    const { message } = reaction;
    const { guild } = message;

    const [fetchedMessage, title, size, members] = fetchMessageCache(guild.id, message.id);
    if (!fetchedMessage) {
        console.log("Unable to retrieve message from group cache");
        return;
    }

    if (fetchedMessage.id === message.id) {
        const guildMember = await guild.member(user.id);
        const { id } = guildMember;
        const currentMembers = Object.keys(members);

        if (
            (!currentMembers.includes(id)) ||
            (members[id].status === groupStatus.UNKNOWN && reaction.emoji.name !== "❓") ||
            ((members[id].status === groupStatus.CONFIRMED || members[id].status === groupStatus.WAITING) && reaction.emoji.name === "❓")
        ) {
            return;
        }

        if (members[id].status === groupStatus.CONFIRMED) {
            for (const member in members) {
                if (members[member].status === groupStatus.WAITING) {
                    members[member].status = groupStatus.CONFIRMED;
                    break;
                }
            }
        }

        const newMembers = currentMembers.reduce((acc, val) => {
            if (val !== id) {
                acc[val] = members[val];
            }
            return acc;
        }, {});

        const newEmbed = constructEmbed(newMembers, title, size);
        await fetchedMessage.edit(newEmbed).then(async newMessage => {
            await removeMemberFromCache(guild.id, message.id, id);
            const obj = {
                guildId: guild.id,
                channelId: message.channel.id,
                messageId: newMessage.id,
                title,
                size
            };

            await groupSchema.findOneAndUpdate(obj, {
                ...obj,
                $pull: {
                    members: {
                        id
                    }
                }
            }, {
                upsert: true
            });
        });
    }
}

module.exports = {
    handleRemoveReaction
};