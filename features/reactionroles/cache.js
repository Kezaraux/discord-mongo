const cache = {};

// {
//     guildId: {
//         messageId: [
//             message,
//             {
//                 Emoji: RoleID,
//                 Emoji: RoleID,
//                 ...
//             }
//         ]
//     }
// }

const fetchGuildCache = (guildId) => cache[guildId] || {};

const fetchMessageCache = (guildId, messageId) => fetchGuildCache(guildId)[messageId] || [];

const setMessageCache = (guildId, messageId, array) => cache[guildId] = { ...cache[guildId], [messageId]: array }

const addToCache = async (guildId, message, emoji, roleId) => {
    const guildCache = fetchGuildCache(guildId);
    const array = guildCache[message.id] || [message, {}];

    if (emoji && roleId) {
        array[1][emoji] = roleId
    }

    // Add message to DiscordJS cache
    await message.channel.messages.fetch(message.id, true, true);

    cache[guildId] = { ...cache[guildId], [message.id]: array };
};

const logCache = () => console.log(cache);

module.exports = {
    fetchGuildCache,
    fetchMessageCache,
    setMessageCache,
    addToCache,
    logCache
};