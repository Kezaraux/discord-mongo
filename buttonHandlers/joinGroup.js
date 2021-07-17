const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupMemberAdded } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents");
const groupSchema = require("../models/group");
const groupStatus = require("../constants/groupStatus");

module.exports = {
	name: buttonCustomIds.JOIN_GROUP,
	execute: async ({ interaction, client, logger }) => {
		logger.info("Handling join group");
		const { message, member } = interaction;

		const group = groupsSelector.selectById(store.getState(), message.id);

		if (Object.keys(group.members).includes(member.id)) {
			logger.info(`Member with id ${member.id} tried to join a group they're already in.`);
			interaction.reply({ content: "You're already in this group!", ephemeral: true });
			return;
		}

		let confirmedCount = 0;
		for (const member in group.members) {
			if (group.members[member].status === groupStatus.CONFIRMED) {
				confirmedCount++;
			}
		}

		let statusToAdd;
		if (confirmedCount === group.size) {
			statusToAdd = groupStatus.WAITING;
		} else {
			statusToAdd = groupStatus.CONFIRMED;
		}

		const newMembers = {
			...group.members,
			[member.id]: { displayName: member.displayName, status: statusToAdd }
		};

		const newEmbed = constructGroupEmbed(
			newMembers,
			group.title,
			group.size,
			group.time,
			group.creatorDisplayName
		);
		const newButtons = constructGroupButtons();

		message.edit({ embeds: [newEmbed], components: newButtons }).then(async (newMsg) => {
			store.dispatch(
				groupMemberAdded({
					id: group.id,
					member: { id: member.id, displayName: member.displayName, status: statusToAdd }
				})
			);

			const obj = {
				guildId: message.channel.guildId,
				channelId: message.channel.id,
				messageId: newMsg.id,
				title: group.title,
				size: group.size,
				time: group.time
			};

			await groupSchema.findOneAndUpdate(
				obj,
				{
					...obj,
					$addToSet: {
						members: [
							{
								status: statusToAdd,
								id: member.id,
								displayName: member.displayName
							}
						]
					}
				},
				{
					upsert: true
				}
			);

			interaction.reply({ content: "I've added you to the group!", ephemeral: true });
		});
	}
};
