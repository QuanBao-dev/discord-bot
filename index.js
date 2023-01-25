require("dotenv").config();
const { default: axios } = require("axios");
const Discord = require("discord.js");
const mongoose = require("mongoose");
const patchModel = require("./models/patch.model");
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMessageTyping,
    Discord.GatewayIntentBits.DirectMessages,
  ],
});
patchModel.watch().on("change", (data) => {
  switch (data.operationType) {
    case "insert":
      const announcementChannel = client.channels.cache.get(
        "1063717809114329140"
      );
      const supportMeChannelString = client.channels.cache
        .get("1063881195458396210")
        .toString();
      const document = data.fullDocument;
      const { title, id } = document.dataVN;
      announcementChannel.send(`
        @everyone, New Machine Translation has been published.\n**${title}**\nhttps://sugoivisualnovel.up.railway.app/vns/${id}\n${supportMeChannelString}`);
      break;
    default:
      break;
  }
});
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify:false
  },
  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("connected to db");
    }
  }
);

const featureList = {
  warningDiscordInvitation: async (msg) => {
    if (msg.content.match(/https:\/\/discord.gg\/.+/g)) {
      await msg.reply(
        "**WARNING: This is a invitation from other discord servers. Please make sure you clearly know about the discord server before deciding to join it. It could be an invitation sent by a hacker.**"
      );
    }
  },

  adminCommand: async (msg) => {
    if (msg.content.match(/^!/g)) {
      const permission = msg.member.permissions.has("Administrator");
      if (!permission)
        return message.reply(
          "❌ | You don't have permission to use this command"
        );
      let command = msg.content.split("!");
      const mentionedMember = msg.mentions.members.first();
      if (!command[1] || !mentionedMember) return;
      const message = command[1].split(" ").slice(2).join(" ");
      command = command[1].split(" ")[0];
      const channel = client.channels.cache.get(msg.channel.id);
      msg.delete();
      switch (command) {
        case "warn":
          if (!message) return;
          channel.send(
            `${mentionedMember.toString()} has been warned:\n*${message}*`
          );
          break;
        case "ban":
          if (!message) return;
          mentionedMember.ban({
            reason: message,
          });
          break;
        default:
          break;
      }
    }
  },
  generateWaifuPic: async (msg) => {
    if (msg.content.match(/^!/g)) {
      if (
        [
          "1066116904013541510",
          "1066116677084917870",
        ].includes(msg.channel.id)
      ) {
        let command = msg.content.split("!");
        if (!command[1]) return;
        isNsfw = false;
        if (msg.channel.id === "1066116677084917870") isNsfw = true;
        if (command[1] === "wa") {
          const { url } = (
            await axios.get(
              `https://api.waifu.pics/${isNsfw ? "nsfw" : "sfw"}/waifu`
            )
          ).data;
          msg.reply(url);
        }
      }
    }
  },
};

client.login(process.env.DISCORD_TOKEN);
client.on("messageCreate", async (msg) => {
  Object.keys(featureList).forEach((keyCommand) => {
    featureList[keyCommand](msg);
  });
  // const privateChannel = client.channels.cache.get('1066129550091763905');
  // privateChannel.send("Ready");
});
