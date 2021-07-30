const groupSchema = require("../../models/group");
const optionTypes = require("../../constants/commandOptionTypes");
const store = require("../../redux/store");
const { groupAdded } = require("../../redux/groupsSlice");
const { constructGroupEmbed, constructGroupButtons } = require("../../helpers/messageComponents");

module.exports = {
	name: "create-group",
	description: "A command for forming groups.",
	global: true,
	options: [
		{
			name: "title",
			description: "Name for the group.",
			type: optionTypes.STRING,
			required: true
		},
		{
			name: "size",
			description: "Number of members required to fill the group.",
			type: optionTypes.INTEGER,
			required: true
		},
		{
			name: "when",
			description: "A blurb of text describing when the group's activity is.",
			type: optionTypes.STRING,
			required: true
		},
		{
			name: "channel",
			description: "The channel you wish this group to appear in.",
			type: optionTypes.CHANNEL
		}
	],
	execute: async (interaction, args, logger) => {
		const { title, size, when, channel } = args;
		const { member } = interaction;

		let fetchedChannel;
		if (channel) {
			fetchedChannel = await member.guild.channels.cache.get(channel);
		}

		const targetChannel = fetchedChannel || interaction.channel;

		const embed = constructGroupEmbed({}, title, size, when, member.displayName);
		const components = constructGroupButtons();

		const newMessage = await targetChannel.send({
			embeds: [embed],
			components
		});

		store.dispatch(
			groupAdded({
				id: newMessage.id,
				channelId: newMessage.channel.id,
				guildId: newMessage.channel.guildId,
				title,
				size,
				time: when,
				creatorDisplayName: member.displayName,
				members: {}
			})
		);

		new groupSchema({
			guildId: newMessage.channel.guildId,
			channelId: newMessage.channel.id,
			messageId: newMessage.id,
			title,
			size,
			time: when,
			creatorId: member.id,
			creatorDisplayName: member.displayName,
			members: []
		})
			.save()
			.then(async () => {
				await interaction.reply({
					content: "I've created your group!",
					ephemeral: true
				});
			})
			.catch(async () => {
				await interaction.reply({
					content:
						"I've created your group, however I ran into an issue trying to save it to the database. Please report this to my creator!\nYour group still exists, so feel free to use it!",
					ephemeral: true
				});
			});
	}
};
