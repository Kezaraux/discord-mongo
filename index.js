const fs = require("fs");
const Discord = require("discord.js");
const winston = require("winston");
const { connect } = require("mongoose");
const { TOKEN, MONGO_URI, TEST_SERVERS } = require("./config.json");

const logger = winston.createLogger({
	transports: [new winston.transports.Console()],
	format: winston.format.printf((log) => `[${log.level.toUpperCase()}] - ${log.message}`)
});

const intents = new Discord.Intents();
const intentFlags = Discord.Intents.FLAGS;
intents.add(intentFlags.GUILDS, intentFlags.GUILD_MEMBERS, intentFlags.GUILD_MESSAGES);

const client = new Discord.Client({ intents });
client.commands = new Discord.Collection();
client.buttonHandlers = new Discord.Collection();

client.testServers = TEST_SERVERS;

// Register event listeners
logger.log("info", "Loading event files");
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, async (...args) => await event.execute({ ...args, client, logger }));
	} else {
		client.on(event.name, async (...args) => await event.execute({ ...args, client, logger }));
	}
}
logger.log("info", "Done loading event files");

// Register button handlers
logger.info("Loading button handlers");
const buttonHandlerFolder = fs
	.readdirSync("./buttonHandlers")
	.filter((file) => file.endsWith(".js"));
for (const file of buttonHandlerFolder) {
	const handler = require(`./buttonHandlers/${file}`);
	client.buttonHandlers.set(handler.name, handler);
}
logger.info("Done loading button handlers");

(async () => {
	await connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	});
	logger.info("Connected to the Database");

	return client.login(TOKEN);
})();
