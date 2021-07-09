const { MessageEmbed } = require("discord.js");

const { addToCache } = require("../features/group");
const groupSchema = require("../models/group");
const groupStatus = require("../constants/groupStatus");

module.exports = {
    slash: true,
    testOnly: true, // Can only be registered in test guilds
    description: "A command for forming groups",
    minArgs: 2,
    expectedArgs: "<group name> <number needed> [channel]",
    callback: async ({ channel, args }) => {
        console.log("Running group command!");
        const [name, num, specifiedChannel] = args;
        const { guild } = channel;

        let fetchedChannel;
        if (specifiedChannel) {
            fetchedChannel = await guild.channels.cache.get(specifiedChannel.substring(2, specifiedChannel.length - 1));
        }

        const targetChannel = fetchedChannel || channel;

        console.log("Got my target channel, constructing message");

        const embed = new MessageEmbed();
        embed.setTitle(name);
        embed.setDescription(`Number of members needed: ${num}`);
        embed.addField(groupStatus.CONFIRMED, "None", true);
        embed.addField(groupStatus.WAITING, "None", true);
        embed.addField(groupStatus.UNKNOWN, "None", true);

        const newMessage = await targetChannel.send(embed);
        newMessage.react("👍");
        newMessage.react("❓");

        console.log("Sent the message, added reactions. Adding to cache and DB");

        await addToCache(guild.id, newMessage, name, num);

        new groupSchema({
            guildId: guild.id,
            channelId: targetChannel.id,
            messageId: newMessage.id,
            title: name,
            size: num,
            members: []
        }).save().catch(() => {
            targetChannel.send("Failed to save to the database. Please report this!").then((message) => {
                message.delete({
                    timeout: 1000 * 10
                })
            });
        });

        console.log("Done running group command");
        // console.log(newMessage);
        return "\u200b";
    }
}