const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupMembersSet } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents");
const groupSchema = require("../models/group");
const groupStatus = require("../constants/groupStatus");

module.exports = {
	name: buttonCustomIds.LEAVE_GROUP,
	execute: async ({ interaction, client, logger }) => {
		logger.info("Handling join group");
		const { message, member } = interaction;

		const group = groupsSelector.selectById(store.getState(), message.id);

		if (!Object.keys(group.members).includes(member.id)) {
			logger.info(`Member with id ${member.id} tried to leave a group they're not in.`);
			interaction.reply({ content: "You're not in this group!", ephemeral: true });
			return;
		}

		const leaverStatus = group.members[member.id].status;

		const currentMembers = Object.keys(group.members);
		let updatedOne = false;
		const newMembers = currentMembers.reduce((acc, val) => {
			if (val !== member.id) {
				// Create new object since old one you couldn't overwrite properties
				acc[val] = { ...group.members[val] };
			}

			if (leaverStatus === groupStatus.CONFIRMED && !updatedOne) {
				if (acc[val]?.status === groupStatus.WAITING) {
					acc[val].status = groupStatus.CONFIRMED;
					updatedOne = true;
				}
			}
			return acc;
		}, {});

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
				groupMembersSet({
					id: group.id,
					members: newMembers
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
					$set: {
						members: Object.keys(newMembers).reduce((acc, val) => {
							acc.push({
								id: val,
								status: newMembers[val].status,
								displayName: newMembers[val].displayName
							});
							return acc;
						}, [])
					}
				},
				{
					upsert: true
				}
			);

			interaction.reply({ content: "I've removed you from the group!", ephemeral: true });
		});
	}
};
