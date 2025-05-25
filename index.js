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
patchModel.watch().on("change", async (data) => {
  try {
    switch (data.operationType) {
      case "insert":
        const document = data.fullDocument;
        if (!document.isNotifyDiscord) return;
        notifyDiscordMessage(
          document.dataVN,
          document.channelAnnouncementId,
          document.isMemberOnly
        );
        break;
      case "update":
        const patch = await patchModel
          .findOne({ _id: data.documentKey._id })
          .lean();
        if (!patch.isNotifyDiscord) return;
        notifyDiscordMessage(
          patch.dataVN,
          patch.channelAnnouncementId,
          patch.isMemberOnly
        );
        break;
      default:
        break;
    }
  } catch (error) {
    console.log(error);
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
        ["1066116904013541510", "1066116677084917870"].includes(msg.channel.id)
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
function notifyDiscordMessage(dataVN, channelAnnouncementId, isMemberOnly) {
  let announcementChannel = client.channels.cache.get(channelAnnouncementId);
  const { title, id, image, rating } = dataVN;
  const embedMessage = new Discord.EmbedBuilder()
    .setColor("0x0099FF")
    .setTitle(`🎉 New ${isMemberOnly ? "Early Access" : ""} Release 🔥🔥🔥!!`)
    .setURL(`https://sugoivisualnovel2.up.railway.app/vns/${id}`)
    .setAuthor({
      name: "GVN",
      iconURL:
        "https://media.discordapp.net/attachments/1066129550091763905/1068209675788628060/clannad.jpg",
      url: "https://sugoivisualnovel2.up.railway.app/vns/${id}",
    })
    .setDescription(`New patch has been released on my site. Enjoy!`)
    .addFields(
      { name: "Title", value: `**${title}**` },
      {
        name: "Release Date",
        value: `${
          new Date(Date.now()).toUTCString().slice(0, 16) +
          "\n" +
          new Date(Date.now()).toUTCString().slice(16)
        }`,
      },
      { name: "Rating", value: `${rating}` }
    )
    .setThumbnail(
      "https://images-ext-1.discordapp.net/external/OM8X_KBrqPCGZjLMIOYhv69Y6qMycBylotIZuiYV-zc/https/cdn-longterm.mee6.xyz/plugins/welcome/images/1059197207909253130/a4d5e041bba23c0531de88e88fd89ddf19b9017df784dc8a616997e462ead943.jpeg?width=1097&height=617"
    )
    .setImage(image)
    .setFooter({
      text: `*If you want to encourage me to do more, you can buy me a coffee*`,
      iconURL:
        "https://images-ext-1.discordapp.net/external/OM8X_KBrqPCGZjLMIOYhv69Y6qMycBylotIZuiYV-zc/https/cdn-longterm.mee6.xyz/plugins/welcome/images/1059197207909253130/a4d5e041bba23c0531de88e88fd89ddf19b9017df784dc8a616997e462ead943.jpeg?width=1097&height=617",
    });
  announcementChannel.send({
    content: "",
    embeds: [embedMessage],
  });
}
