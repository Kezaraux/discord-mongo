const messageSchema = require("../../models/message");
const { handleReaction } = require("./handleReaction");
const { setMessageCache } = require("./cache");

module.exports = async (client) => {
    console.log("Setting up feature: Reaction Roles");
    client.on("messageReactionAdd", (reaction, user) => {
        handleReaction(reaction, user, true);
    });
    client.on("messageReactionRemove", (reaction, user) => {
        handleReaction(reaction, user, false);
    });

    const results = await messageSchema.find();

    for (const result of results) {
        const { guildId, channelId, messageId, roles } = result;

        const guild = await client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(`Removing guild ID "${guildId}" from the database.`);
            await messageSchema.deleteOne({ guildId });
            return;
        }

        const channel = await guild.channels.cache.get(channelId);

        if (!channel) {
            console.log(`Removing channel ID "${channelId}" from the database.`);
            await messageSchema.deleteOne({ channelId });
            return;
        }

        try {
            const cacheMessage = true;
            const skipCache = true;
            const fetchedMessage = await channel.messages.fetch(messageId, cacheMessage, skipCache);

            if (fetchedMessage) {
                const newRoles = {};

                for (const role of roles) {
                    const { emoji, roleId } = role;
                    newRoles[emoji] = roleId;
                }

                setMessageCache(guildId, messageId, [fetchedMessage, newRoles]);
            }
        } catch (e) {
            console.log(`Removing message ID "${messageId}" from the database.`);
            await messageSchema.deleteOne({ messageId });
            return;
        }
    }

    console.log("Completed setup for feature: Reaction Roles");
};