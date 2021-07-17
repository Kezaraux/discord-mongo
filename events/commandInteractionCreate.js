module.exports = {
	name: "interactionCreate",
	once: false,
	execute: async ({ 0: interaction, client, logger }) => {
		if (!interaction.isCommand()) return;
		logger.info("Handling a command");

		//   console.log(interaction);

		const { commandName, options } = interaction;
		if (!client.commands.has(commandName)) return;

		// console.log("Interaction info:");
		// console.log(commandName);
		// console.log(options);

		const args = {};
		if (options) {
			options.each((option) => {
				const { name, value } = option;
				args[name] = value;
			});
		}

		const command = client.commands.get(commandName);

		try {
			await command.execute(interaction, args, logger);
		} catch (error) {
			console.error(error);
		}
	}
};
