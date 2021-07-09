const groupSchema = require("../../models/group");
const { setMessageCache, logCache } = require("./cache");
const { handleAddReaction } = require("./handleAddReaction");
const { handleRemoveReaction } = require("./handleRemoveReaction");

module.exports = async (client) => {
    console.log("Setting up feature: Groups");
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
                    const { displayName, status, id } = member;
                    newMembers[id] = { status, displayName };
                }

                setMessageCache(guildId, messageId, [fetchedMessage, title, size, newMembers]);
            }
        } catch (e) {
            // console.error("Encountered error: ", e);
            console.log(`Removing message ID "${messageId}" from the database.`);
            await groupSchema.deleteOne({ messageId });
            continue;
        }
    }
    console.log("Completed setup for feature: Groups");
}
