const { fetchMessageCache, addToCache } = require("../features/reactionroles/cache");
const permissions = require("../constants/permissions");
const messageSchema = require("../models/message");

module.exports = {
    minArgs: 4,
    expectedArgs: "<Message ID> <Emoji> <Role name, tag, or id> <Role display name>",
    requiredPermission: [permissions.ADMINISTRATOR],
    callback: async ({ message, args }) => {
        const { guild } = message;

        if (!guild.me.hasPermission(permissions.MANAGE_ROLES)) {
            message.reply("The bot requires access to manage roles to work correctly.");
            return;
        }

        const msgId = args.shift();
        let emoji = args.shift();
        let role = args.shift();
        const descriptorText = args.join(" ");

        if (role.startsWith("<@&")) {
            role = role.substring(3, role.length - 1);
        }

        const newRole = guild.roles.cache.find(r => (r.name === role || r.id === role)) || null;

        if (!newRole) {
            message.reply(`Could not fine a role for "${role}"`);
        }

        role = newRole;

        if (emoji.includes(":")) {
            const emojiName = emoji.split(":")[1];
            emoji = guild.emojis.cache.find(e => e.name === emojiName);
        }

        const [fetchedMessage] = fetchMessageCache(guild.id, msgId);

        if (!fetchedMessage) {
            message.reply("An error occurred, please try again.");
            return;
        }

        const newLine = `${emoji} ${descriptorText}`;
        let { content } = fetchedMessage;

        if (content.includes(emoji)) {
            const split = content.split("\n");
            for (let a = 0; a < split.length; ++a) {
                if (split[a].includes(emoji)) {
                    split[a] = newLine;
                }

                content = split.join("\n");
            }
        } else {
            content += `\n${newLine}`;
            fetchedMessage.react(emoji);
        }

        fetchedMessage.edit(content);

        const obj = {
            guildId: guild.id,
            channelId: fetchedMessage.channel.id,
            messageId: fetchedMessage.id
        }

        await messageSchema.findOneAndUpdate(obj, {
            ...obj,
            $addToSet: {
                roles: {
                    emoji,
                    roleId: role.id
                }
            }
        }, {
            upsert: true
        });

        addToCache(guild.id, fetchedMessage, emoji, role.id);
    }
}