const DiscordJS = require("discord.js");
const WOKCommands = require("wokcommands");
require("dotenv").config();

const permissions = require("./constants/permissions");

const guildId = "302690115505881089"; // USED FOR DEVELOPMENT
const client = new DiscordJS.Client();

// const getApp = (guildId) => {
//     const app = client.api.applications(client.user.id);
//     if (guildId) {
//         app.guilds(guildId);
//     }
//     return app;
// }

client.on("ready", async () => {
    new WOKCommands(client, {
        commandDir: "commands",
        featureDir: "features",
        showWarns: false,
        testServers: [guildId]
    })
        .setMongoPath(process.env.MONGO_URI)
        .setDisplayName("Group Utility")
        .setCategorySettings([
            {
                name: "Groups",
                emoji: "🤼"
            },
            {
                name: "Utility",
                emoji: "📰"
            },
            {
                name: "Development",
                emoji: "🚧",
                hidden: true
            }
        ]);

    process.on("unhandledRejection", e => {
        console.error("Unhandled promise rejection:", e);
    })

    client.on("message", (message) => {
        if (message.author.bot && message.content === "\u200b" && message.guild.me.hasPermission(permissions.MANAGE_MESSAGES)) {
            message.delete();
        }
    });

    // const slashCommands = await getApp(guildId).commands.get();
    // console.log(slashCommands);

    // await getApp(guildId).commands.post({
    //     data: {
    //         name: "group",
    //         description: "A command for forming groups",
    //         options: [
    //             {
    //                 name: "Group name",
    //                 description: "The name of the group",
    //                 required: true,
    //                 type: 3 // String
    //             },
    //             {
    //                 name: "members",
    //                 description: "The number of members needed for the group",
    //                 required: true,
    //                 type: 4 // integer
    //             }
    //         ]
    //     }
    // });

    // clients.ws.on("INTERACTION_CREATE", async (interaction) => {
    //     const { name, options } = interaction.data;
    //     const command = name.toLowerCase();
    //     console.log(command);
    //     console.log(options);

    //     const args = {};

    //     if (options) {
    //         for (const option of options) {
    //             const { name, value } = option;
    //             args[name] = value;
    //         }
    //     }

    //     if (command === "group") {
    //         const embed = new DiscordJS.MessageEmbed().setTitle("Example");
    //         for (const arg in args) {
    //             const value = args[arg];
    //             embed.addField(arg, value);
    //         }

    //         reply(interaction, "Testing 123");
    //     }
    // });

    // const reply = (interaction, response) => {
    //     let data = {
    //         content: response
    //     }

    //     if (typeof response === object) {   // Handle embeds
    //         data = await createAPIMessage(interaction, response);
    //     }

    //     client.api.interactions(interaction.id, interaction.token).callback.post({
    //         data: {
    //             type: 4,
    //             data
    //         }
    //     });
    // }

    // const createAPIMessage = async (interaction, content) => {
    //     const { data, files } = await DiscordJS.APIMessage.create(
    //         client.channels.resolve(interaction.channel_id),
    //         content
    //     ).resolveData().resolveFiles();

    //     return { ...data, files };
    // }

    client.user.setActivity("!help for commands");
    console.log("Bot is logged in and ready");
});

client.login(process.env.TOKEN);