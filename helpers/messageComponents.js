const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

const groupStatus = require("../constants/groupStatus");
const buttonCustomIds = require("../constants/buttonCustomIds");

const constructGroupEmbed = (members, title, size, time, creatorDisplayName) => {
	const embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(`Number of members needed: ${size}`);
	embed.addField("Time", time, false);
	const confirmed = [];
	const waiting = [];
	const unknown = [];

	for (const member in members) {
		switch (members[member].status) {
			case groupStatus.CONFIRMED:
				confirmed.push(members[member].displayName);
				break;
			case groupStatus.WAITING:
				waiting.push(members[member].displayName);
				break;
			case groupStatus.UNKNOWN:
				unknown.push(members[member].displayName);
				break;
			default:
				console.log(
					`Unknown member status encountered, it was: ${members[member].status}. Check group handle reaction.`
				);
		}
	}

	embed.addField(
		`${groupStatus.CONFIRMED} (${confirmed.length}/${size})`,
		confirmed.join("\n") || "None",
		true
	);
	embed.addField(`${groupStatus.WAITING} (${waiting.length})`, waiting.join("\n") || "None", true);
	embed.addField(`${groupStatus.UNKNOWN} (${unknown.length})`, unknown.join("\n") || "None", true);
	embed.setFooter(`Group created by: ${creatorDisplayName}`);

	return embed;
};

const constructGroupButtons = () => {
	const joinRow = new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId(buttonCustomIds.JOIN_GROUP)
			.setLabel("Join group")
			.setStyle("SUCCESS"),
		new MessageButton()
			.setCustomId(buttonCustomIds.SHOW_INTEREST)
			.setLabel("Unsure but interested")
			.setStyle("PRIMARY")
	);
	const leaveRow = new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId(buttonCustomIds.LEAVE_GROUP)
			.setLabel("Leave group")
			.setStyle("SECONDARY"),
		new MessageButton()
			.setCustomId(buttonCustomIds.REMOVE_GROUP)
			.setLabel("Remove group")
			.setStyle("DANGER")
	);

	return [joinRow, leaveRow];
};

module.exports = {
	constructGroupEmbed,
	constructGroupButtons
};
