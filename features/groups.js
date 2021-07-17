const store = require("../redux/store");
const { groupAdded } = require("../redux/groupsSlice");
const groupSchema = require("../models/group");

module.exports = {
	execute: async (client, logger) => {
		logger.info("Fetching stored groups and populating cache");
		const results = await groupSchema.find();

		for (const result of results) {
			const {
				guildId,
				channelId,
				messageId,
				title,
				size,
				time,
				members,
				creatorId,
				creatorDisplayName
			} = result;

			const guild = await client.guilds.cache.get(guildId);

			if (!guild) {
				logger.info(`Removing guild ID "${guildId}" from the database.`);
				await groupSchema.deleteOne({ guildId });
				continue;
			}

			const channel = await guild.channels.cache.get(channelId);

			if (!channel) {
				logger.info(`Removing channel ID "${channelId}" from the database.`);
				await groupSchema.deleteOne({ channelId });
				continue;
			}

			try {
				const cacheMessage = true;
				const skipCache = true;
				const fetchedMessage = await channel.messages.fetch(messageId, cacheMessage, skipCache);

				if (fetchedMessage) {
					const newMembers = {};

					for (const member of members) {
						const { displayName, status, id } = member;
						newMembers[id] = { status, displayName };
					}

					store.dispatch(
						groupAdded({
							id: messageId,
							title,
							size,
							time,
							creatorId,
							creatorDisplayName,
							members: newMembers
						})
					);
				}
			} catch (e) {
				// console.error("Encountered error: ", e);
				logger.info(`Removing message ID "${messageId}" from the database.`);
				await groupSchema.deleteOne({ messageId });
				continue;
			}
		}
		logger.info("Done fetching groups");
	}
};
