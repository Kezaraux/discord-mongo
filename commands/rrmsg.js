const messageSchema = require("../models/message");
const permissions = require("../constants/permissions");
const { addToCache } = require("../features/reactionroles/cache");

module.exports = {
    minArgs: 1,
    expectedArgs: "[Channel tag] <Message text>",
    requiredPermissions: [permissions.ADMINISTRATOR],
    callback: async ({ message, args }) => {
        const { guild, mentions } = message;
        const { channels } = mentions;
        const targetChannel = channels.first() || message.channel;

        if (channels.first()) {
            args.shift();
        }

        const text = args.join(" ");
        const newMessage = await targetChannel.send(text);

        if (guild.me.hasPermission(permissions.MANAGE_MESSAGES)) {
            message.delete();
        }

        if (!guild.me.hasPermission(permissions.MANAGE_ROLES)) {
            message.reply("The bot requires access to manage roles to be able to give or remove roles.")
            return;
        }

        addToCache(guild.id, newMessage);

        new messageSchema({
            guildId: guild.id,
            channelId: targetChannel.id,
            messageId: newMessage.id
        }).save().catch(() => {
            message.reply("Failed to save to the database. Please report this!").then((message) => {
                message.delete({
                    timeout: 1000 * 10
                })
            });
        });
    }
}