const buttonCustomIds = require("../constants/buttonCustomIds");
const permissions = require("../constants/permissions");
const { groupsSelector, groupRemoved } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const groupSchema = require("../models/group");
const groupStatus = require("../constants/groupStatus");

module.exports = {
	name: buttonCustomIds.REMOVE_GROUP,
	execute: async ({ interaction, client, logger }) => {
		const { message, member } = interaction;
		const group = groupsSelector.selectById(store.getState(), message.id);

		let confirmedCount = 0;
		for (const member in group.members) {
			if (group.members[member].status === groupStatus.CONFIRMED) {
				confirmedCount++;
			}
		}

		if (member.displayName === group.creatorDisplayName || confirmedCount === group.size) {
			const bot = await interaction.guild.members.fetch(client.user.id);
			if (bot.permissions.has(permissions.MANAGE_MESSAGES)) {
				logger.info(`Deleting message with id ${message.id}`);

				store.dispatch(groupRemoved({ id: message.id }));
				groupSchema.deleteOne({ messageId: message.id });
				message.delete();

				interaction.reply({ content: "I've removed the group!", ephemeral: true });
			} else {
				logger.info(
					`Could not delete message with id ${interaction.message.id} due to lacking permissions`
				);
				interaction.reply({
					content: "I can't remove the group since I lack the permissions to manage messages!",
					ephemeral: true
				});
			}
		} else {
			interaction.reply({
				content:
					"The group can only be removed if: the group creator requests it, or if the group is full.",
				ephemeral: true
			});
			return;
		}
	}
};
