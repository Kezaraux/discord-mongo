const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

const groupSchema = require("../../models/group");
const groupStatus = require("../../constants/groupStatus");
const optionTypes = require("../../constants/commandOptionTypes");
const buttonCustomIds = require("../../constants/buttonCustomIds");
const store = require("../../redux/store");
const { groupAdded } = require("../../redux/groupsSlice");
const { constructGroupEmbed, constructGroupButtons } = require("../../helpers/messageComponents");

module.exports = {
	name: "create-group",
	description: "A command for forming groups.",
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
		// const embed = new MessageEmbed();
		// embed.setTitle(title);
		// embed.setDescription(`Number of members needed: ${size}`);
		// embed.addField("Time", when, false);
		// embed.addField(`${groupStatus.CONFIRMED} (0/${size})`, "None", true);
		// embed.addField(`${groupStatus.WAITING} (0)`, "None", true);
		// embed.addField(`${groupStatus.UNKNOWN} (0)`, "None", true);
		// embed.setFooter(`Group created by: ${member.displayName}`);
		const components = constructGroupButtons();

		// const row = new MessageActionRow().addComponents(
		// 	new MessageButton()
		// 		.setCustomId(buttonCustomIds.JOIN_GROUP)
		// 		.setLabel("Join group")
		// 		.setStyle("SUCCESS"),
		// 	new MessageButton()
		// 		.setCustomId(buttonCustomIds.SHOW_INTEREST)
		// 		.setLabel("Unsure but interested")
		// 		.setStyle("PRIMARY"),
		// 	new MessageButton()
		// 		.setCustomId(buttonCustomIds.LEAVE_GROUP)
		// 		.setLabel("Leave group")
		// 		.setStyle("SECONDARY"),
		// 	new MessageButton()
		// 		.setCustomId(buttonCustomIds.REMOVE_GROUP)
		// 		.setLabel("Remove group")
		// 		.setStyle("DANGER")
		// );

		const newMessage = await targetChannel.send({
			embeds: [embed],
			// components: [row]
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
