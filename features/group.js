const { MessageEmbed } = require("discord.js");

const permissions = require("../constants/permissions");
const groupStatus = require("../constants/groupStatus");
const groupSchema = require("../models/group");

const cache = {}; // { guildId: [message, title, size, members: { id: {status, displayName}, ... }] }

const fetchCache = (guildId) => cache[guildId] || [];

const addToCache = async (guildId, message, title, size, userId, status, member) => {
    console.log("ADD TO GROUP CACHE");
    const array = cache[guildId] || [message, title, size, {}];

    if (member && status) {
        array[3][userId] = { status, member };
    }

    // Add message to DiscordJS cache
    await message.channel.messages.fetch(message.id, true, true);

    cache[guildId] = array;
    console.log("DONE ADDING TO GROUP CACHE");
};

const removeMemberFromCache = (guildId, userId) => {
    const array = cache[guildId];

    array[3] = Object.keys(array[3]).reduce((acc, val) => {
        if (val !== userId) {
            acc[val] = array[3][val];
        }
        return acc;
    }, {});;

    cache[guildId] = array;
}

const constructEmbed = (members, title, size) => {
    console.log("CONSTRUCTING GROUP EMBED");
    const embed = new MessageEmbed().setTitle(title).setDescription(`Number of members needed: ${size}`);
    const confirmed = [];
    const waiting = [];
    const unknown = [];

    for (const member in members) {
        switch (members[member].status) {
            case groupStatus.CONFIRMED:
                confirmed.push(members[member].displayName);
                break;
            case groupStatus.WAITING:
                waiting.push(members[member].displayName);
                break;
            case groupStatus.UNKNOWN:
                unknown.push(members[member].displayName);
                break;
            default:
                console.log(`Unknown member status encountered, it was: ${member.status}. Check group handle reaction.`);
        }
    }

    embed.addField(groupStatus.CONFIRMED, confirmed.join("\n") || "None", true);
    embed.addField(groupStatus.WAITING, waiting.join("\n") || "None", true);
    embed.addField(groupStatus.UNKNOWN, unknown.join("\n") || "None", true);

    console.log("DONE CONSTRUCTING GROUP EMBED");
    return embed;
}

const handleAddReaction = async (reaction, user) => {
    console.log("HANDLE ADD REACTION");
    if (user.bot) {
        console.log("Reaction added by a bot, stop handling");
        return;
    }

    const { message } = reaction;
    const { guild } = message;

    const [fetchedMessage, title, size, members] = fetchCache(guild.id);
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
                if (member.status === groupStatus.CONFIRMED) {
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
                console.log("I FUCKED UP EMOJI EVAIL");
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
    }
    console.log("DONE HANDLING REACTION ADD");
}

const handleRemoveReaction = async (reaction, user) => {
    console.log("HANDLE REMOVE REACTION");
    if (user.bot) {
        console.log("Reaction removed by a bot, stop handling");
        return;
    }

    const { message } = reaction;
    const { guild } = message;

    const [fetchedMessage, title, size, members] = fetchCache(guild.id);
    if (!fetchedMessage) {
        console.log("Unable to retrieve message from cache");
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

        const newMembers = currentMembers.reduce((acc, val) => {
            if (val !== id) {
                acc[val] = members[val];
            }
            return acc;
        }, {});

        const newEmbed = constructEmbed(newMembers, title, size);
        await fetchedMessage.edit(newEmbed).then(async newMessage => {
            await removeMemberFromCache(guild.id, id);
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
    console.log("DONE HANDLING REACTION REMOVE");
}

module.exports = async (client) => {
    console.log("Doing group setup!");
    client.on("messageReactionAdd", async (reaction, user) => {
        await handleAddReaction(reaction, user);
    });
    client.on("messageReactionRemove", async (reaction, user) => {
        await handleRemoveReaction(reaction, user);
    });

    const results = await groupSchema.find();

    for (const result of results) {
        const { guildId, channelId, messageId, title, size, members } = result;

        const guild = await client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(`Removing guild ID "${guildId}" from the database.`);
            await groupSchema.deleteOne({ guildId });
            continue;
        }

        const channel = await guild.channels.cache.get(channelId);

        if (!channel) {
            console.log(`Removing channel ID "${channelId}" from the database.`);
            await groupSchema.deleteOne({ channelId });
            continue;
        }

        try {
            const cacheMessage = true;
            const skipCache = true;
            const fetchedMessage = await channel.messages.fetch(messageId, cacheMessage, skipCache);

            if (fetchedMessage) {
                const newMembers = {};

                for (const member of members) {
                    const { displayName, status, userId } = member;
                    newMembers[userId] = { status, displayName };
                }

                cache[guildId] = [fetchedMessage, title, size, newMembers];
            }
        } catch (e) {
            console.log(`Removing message ID "${messageId}" from the database.`);
            await groupSchema.deleteOne({ messageId });
            continue;
        }
    }
    console.log("Finished group setup!");
}

module.exports.fetchCache = fetchCache;
module.exports.addToCache = addToCache;