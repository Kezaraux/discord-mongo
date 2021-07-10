const momentTimezone = require("moment-timezone");
const { MessageCollector } = require("discord.js");

const scheduledSchema = require("../models/scheduledMessage");
const { findClosestStringInList } = require("../helpers/strings");

module.exports = {
    slash: false,
    testOnly: true, // Can only be registered in test guilds
    category: "Utility",
    description: "Set a reminder for yourself. After providing the time information it will prompt you for the reminder message.",
    minArgs: 4,
    maxArgs: 5,
    expectedArgs: "<YYYY/MM/DD> <HH:mm> <'AM' or 'PM'> <Timezone> [Channel tag]",
    init: (client) => {
        const checkForPosts = async () => {
            const query = {
                date: {
                    $lte: Date.now()
                }
            };

            const results = await scheduledSchema.find(query);

            for (const post of results) {
                const { guildId, channelId, authorId, content } = post;

                const guild = await client.guilds.fetch(guildId);
                if (!guild) {
                    continue;
                }

                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    continue;
                }

                channel.send(`<@${authorId}>: ${content}`);
            }

            await scheduledSchema.deleteMany(query);

            setTimeout(checkForPosts, 1000 * 10);
        }

        checkForPosts();
    },
    callback: ({ message, args }) => {
        const { mentions, guild, channel } = message;
        const targetChannel = mentions.channels.first() || message.channel;

        const [date, time, clockType, timezone] = args;
        const clockTypeCaps = clockType.toUpperCase();

        if (clockTypeCaps !== "AM" && clockTypeCaps !== "PM") {
            message.channel.send("Please use either AM or PM!");
            return;
        }

        const validTimezones = momentTimezone.tz.names();
        if (!validTimezones.includes(timezone)) {
            message.channel.send(`Unknown timezone, did you mean to use: ${findClosestStringInList(timezone, validTimezones)}?`);
            return;
        }

        const targetDate = momentTimezone.tz(
            `${date} ${time} ${clockTypeCaps}`,
            "YYYY-MM-DD HH:mm A",
            timezone
        );

        message.channel.send("Please type out your reminder.");

        const filter = (newMessage) => newMessage.author.id === message.author.id;

        const commandTime = 60 * 1000;
        const collector = new MessageCollector(channel, filter, {
            max: 1,
            time: commandTime
        });

        collector.on("end", async (collected) => {
            const collectedMessage = collected.first();
            if (!collectedMessage) {
                message.channel.send(`Command timed out as you took longer than ${commandTime / 1000} seconds.`);
                return;
            }

            await new scheduledSchema({
                date: targetDate.valueOf(),
                content: collectedMessage.content,
                guildId: guild.id,
                channelId: targetChannel.id,
                authorId: message.author.id
            }).save();

            message.channel.send("Your reminder has been saved!");
        });
    }
}