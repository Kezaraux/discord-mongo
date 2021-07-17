const buttonCustomIds = require("../constants/buttonCustomIds");
const permissions = require("../constants/permissions");

module.exports = {
	name: buttonCustomIds.DELETE_MESSAGE,
	execute: async ({ interaction, client, logger }) => {
		const bot = await interaction.guild.members.fetch(client.user.id);

		if (bot.permissions.has(permissions.MANAGE_MESSAGES)) {
			logger.info(`Deleting message with id ${interaction.message.id}`);
			interaction.message.delete();
		} else {
			logger.info(
				`Could not delete message with id ${interaction.message.id} due to lacking permissions`
			);
			interaction.channel
				.send("I require permission to delete that message")
				.then((msg) => msg.delete({ timeout: 1000 * 10 }));
		}
	}
};
