const { removeMessageFromCache } = require("../features/group/cache");
const groupSchema = require("../models/group");

module.exports = {
    slash: true,
    testOnly: true, // Can only be registered in test guilds
    category: "Groups",
    description: "Used to remove an existing group via a command. Channel specific.",
    minArgs: 1,
    maxArgs: 2,
    expectedArgs: "<message id>",
    callback: async ({ channel, args }) => {
        const [groupMessageId] = args;
        const { guild } = channel;

        const fetchedMessage = await channel.messages.fetch(groupMessageId);
        if (!fetchedMessage) {
            channel.send("Unable to find the specified group.").then(msg => msg.delete({ timeout: 1000 * 10 }));
            return;
        }

        removeMessageFromCache(guild.id, fetchedMessage.id);

        groupSchema.deleteOne({ messageId: fetchedMessage.id });

        fetchedMessage.delete();

        channel.send("Removed the specified group.").then(msg => msg.delete({
            timeout: 1000 * 10
        }));

        return "\u200b";
    }
}