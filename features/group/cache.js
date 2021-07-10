const cache = {};
// {
//     guildId: {
//         messageId: [
//             title,
//             size,
//             members: {
//                 id: {
//                     status, displayName
//                 }
//             }
//         ]
//     }
// }

const fetchGuildCache = (guildId) => cache[guildId] || {};

const fetchMessageCache = (guildId, messageId) => fetchGuildCache(guildId)[messageId] || [];

const setMessageCache = (guildId, messageId, array) => cache[guildId] = { ...cache[guildId], [messageId]: array }

const addToCache = async (guildId, message, title, size, userId, status, member) => {
    const guildCache = fetchGuildCache(guildId);
    const array = guildCache[message.id] || [message, title, size, {}];

    if (member && status) {
        array[3][userId] = { status, displayName: member };
    }

    // Add message to DiscordJS cache
    await message.channel.messages.fetch(message.id, true, true);

    cache[guildId] = { ...cache[guildId], [message.id]: array };
};

const removeMessageFromCache = (guildId, messageId) => {
    const cache = fetchGuildCache(guildId);

    const newCache = Object.keys(cache).reduce((acc, val) => {
        if (val !== messageId) {
            acc[val] = cache[val];
        }
        return acc;
    }, {});

    cache[guildId] = newCache;
}

const removeMemberFromCache = (guildId, messageId, userId) => {
    // Assumes that messageId is already present, issues if not
    const array = cache[guildId][messageId];

    array[3] = Object.keys(array[3]).reduce((acc, val) => {
        if (val !== userId) {
            acc[val] = array[3][val];
        }
        return acc;
    }, {});;

    cache[guildId][messageId] = array;
}

const logCache = () => console.log(cache);

module.exports = {
    fetchGuildCache,
    fetchMessageCache,
    setMessageCache,
    addToCache,
    removeMemberFromCache,
    removeMessageFromCache,
    logCache
};