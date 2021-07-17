const utility = require("../helpers/utility");
const fs = require("fs");

module.exports = {
	name: "ready",
	once: true,
	execute: async ({ client, logger }) => {
		// Register commands
		logger.log("info", "Loading commands");
		const commandFolders = fs.readdirSync("./commands");
		for (const folder of commandFolders) {
			const commandFiles = fs
				.readdirSync(`./commands/${folder}`)
				.filter((file) => file.endsWith(".js"));
			for (const file of commandFiles) {
				const command = require(`../commands/${folder}/${file}`);
				client.commands.set(command.name, command);

				for (const server of client.testServers) {
					const app = utility.getApp(client, server);
					await app.commands.post({
						data: {
							name: command.name,
							description: command.description,
							options: command.options
						}
					});
				}
			}
		}
		logger.log("info", "Done loading/registering commands");

		const commands = [];
		client.commands.each((command) => commands.push(command.name));
		logger.info(commands);

		logger.info("Loading features");
		const featuresFolder = fs.readdirSync("./features");
		for (const file of featuresFolder) {
			const feature = require(`../features/${file}`);
			feature.execute(client, logger);
		}
		logger.info("Done loading features");

		client.user.setActivity("I use slash commands!");
		logger.log("info", "The bot has logged in.");
	}
};
