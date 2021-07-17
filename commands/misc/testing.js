const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

const buttonCustomIds = require("../../constants/buttonCustomIds");
const optionTypes = require("../../constants/commandOptionTypes");

module.exports = {
	name: "test",
	description: "A command to test Discord.js functionality",
	options: [
		{
			name: "message",
			description: "Content to display",
			type: optionTypes.STRING,
			required: true
		},
		{
			name: "extra",
			description: "Random option which is a channel",
			type: optionTypes.CHANNEL
		}
	],
	execute: async (interaction, args, logger) => {
		logger.info("Test command");

		console.log(args.extra);

		const row = new MessageActionRow().addComponents(
			new MessageButton().setCustomId("test").setLabel(`${args.message}`).setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId(buttonCustomIds.DELETE_MESSAGE)
				.setLabel("Delete this")
				.setStyle("DANGER")
		);

		const embed = new MessageEmbed()
			.setTitle(args.message)
			.setDescription("Result of test command");

		await interaction.reply({
			content: "Test command",
			embeds: [embed],
			components: [row]
		});
	}
};
