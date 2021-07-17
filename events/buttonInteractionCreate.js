module.exports = {
	name: "interactionCreate",
	once: false,
	execute: async ({ 0: interaction, client, logger }) => {
		if (!interaction.isButton()) return;
		logger.info("Handling a button");

		// console.log(interaction);
		// console.log(interaction.channel);
		// console.log(interaction.message);

		const { customId } = interaction;
		if (!client.buttonHandlers.has(customId)) {
			logger.info(`Unknown button interaction with custom id: ${customId}`);
			return;
		}

		const handler = client.buttonHandlers.get(customId);

		try {
			await handler.execute({ interaction, client, logger });
		} catch (error) {
			console.error(error);
		}
	}
};
