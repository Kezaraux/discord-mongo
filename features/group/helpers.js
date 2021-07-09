const { MessageEmbed } = require("discord.js");
const groupStatus = require("../../constants/groupStatus");

const constructEmbed = (members, title, size) => {
    const embed = new MessageEmbed().setTitle(title).setDescription(`Number of members needed: ${size}`);
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
                console.log(`Unknown member status encountered, it was: ${member.status}. Check group handle reaction.`);
        }
    }

    embed.addField(groupStatus.CONFIRMED, confirmed.join("\n") || "None", true);
    embed.addField(groupStatus.WAITING, waiting.join("\n") || "None", true);
    embed.addField(groupStatus.UNKNOWN, unknown.join("\n") || "None", true);

    return embed;
}

module.exports = {
    constructEmbed
}