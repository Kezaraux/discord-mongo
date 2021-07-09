const permissions = require("../../constants/permissions");
const { fetchMessageCache } = require("./cache");

const handleReaction = (reaction, user, adding) => {
    const { message } = reaction;
    const { guild } = message;

    const [fetchedMessage, roles] = fetchMessageCache(guild.id, message.id);
    if (!fetchedMessage) {
        console.log("Unable to retrieve message from reaction roles cache");
        return;
    }

    if (fetchedMessage.id === message.id && guild.me.hasPermission(permissions.MANAGE_ROLES)) {
        const toCompare = reaction.emoji.id || reaction.emoji.name;

        for (const key of Object.keys(roles)) {
            if (key === toCompare) {
                const role = guild.roles.cache.get(roles[key]);
                if (role) {
                    const member = guild.members.cache.get(user.id);

                    if (adding) {
                        member.roles.add(role);
                    } else {
                        member.roles.remove(role);
                    }
                }
                return;
            }
        }
    }
};

module.exports = {
    handleReaction
}