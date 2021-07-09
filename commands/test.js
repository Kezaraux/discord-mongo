const { MessageEmbed } = require("discord.js");

module.exports = {
    slash: true,
    testOnly: true,
    description: "TEST COMMAND FOR SHITTY EMBEDS",
    minArgs: 1,
    expectedArgs: "<title> [channel]",
    callback: async ({ channel, args }) => {
        const [title, specifiedChannel] = args;
        const { guild } = channel;

        let fetchedChannel;
        if (specifiedChannel) {
            fetchedChannel = await guild.channels.cache.get(specifiedChannel.substring(2, specifiedChannel.length - 1));
        }

        const targetChannel = fetchedChannel || channel;

        const embed = new MessageEmbed();
        embed.setTitle(title);
        embed.setDescription("Some goddamn description that exists");

        const newMessage = await targetChannel.send(embed);

        // console.log(newMessage);	// This clearly exists
        return "\u200b";
    }
}