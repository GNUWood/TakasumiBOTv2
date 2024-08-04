const Spam = require("../../lib/spam");
const spam = new Spam(800);

module.exports = async(message)=>{
  const { WebhookClient, ButtonBuilder, ActionRowBuilder, ButtonStyle, Colors } = require("discord.js");
  const db = require("../../lib/db");
  const fetchMessage = require("../../lib/fetchMessage");
  const fetchChannel = require("../../lib/fetchChannel");
  const fetchWebhookMessage = require("../../lib/fetchWebhookMessage");
  const money = require("../../lib/money");
  const isAdmin = require("../../lib/isAdmin");
  const parseMessage = require("../../lib/parseMessage");
  const config = require("../../../config.json");

  if(message.author.bot) return;

  const global = await db(`SELECT * FROM global;`);
  if(!global.find(g=>g.channel === message.channel.id)) return;

  const mute_server = await db(`SELECT * FROM mute_server;`);
  const mute_user = await db(`SELECT * FROM mute_user;`);

  if(
    mute_user.find(m=>m.id === message.author.id)||
    mute_server.find(g=>g.id === message.guild.id)||
    message.content.length > 300||
    spam.count(message.guild.id)
  ) return;

  const account = await db(`SELECT * FROM account WHERE id = ${message.author.id};`)
  if(!account[0]) return await message.reply({
    embeds:[{
      author:{
        name: "認証してください",
        icon_url: "https://cdn.takasumibot.com/images/system/error.png"
      },
      color: Colors.Red,
      description: "グローバルチャットを利用するには以下のリンクから認証する必要があります",
    }],
    components:[
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("サイトへ移動")
            .setURL("https://auth.takasumibot.com/")
            .setStyle(ButtonStyle.Link))
        .addComponents(
          new ButtonBuilder()
            .setLabel("サポートサーバー")
            .setURL(config.inviteUrl)
            .setStyle(ButtonStyle.Link))
    ]
  }).catch(()=>{});

  let color = Colors.Green;
  const data = await money.get(message.author.id);

  if(data.random > 0){
    color = Math.floor(Math.random()*(0xffffff + 1));
    await db(`UPDATE money SET random = random - 1 WHERE id = ${message.author.id}`);
  }else if(data.blue > 0){
    color = Colors.Blue;
    await db(`UPDATE money SET blue = blue - 1 WHERE id = ${message.author.id}`);
  }else if(data.red > 0){
    color = Colors.Red;
    await db(`UPDATE money SET red = red - 1 WHERE id = ${message.author.id}`);
  }else if(data.yellow > 0){
    color = Colors.Yellow;
    await db(`UPDATE money SET yellow = yellow - 1 WHERE id = ${message.author.id}`);
  }

  const embed = [{
    color: color,
    author:{
      name: await isAdmin(message.author.id) ? `${message.author.tag}(管理者)` : `${message.author.tag}`,
      url: `https://discord.com/users/${message.author.id}`,
      icon_url: message.author.avatarURL()||message.author.defaultAvatarURL,
    },
    description: parseMessage(message.content),
    footer:{
      text: `${message.guild.name}(${message.guild.id})`,
      icon_url: message.guild.iconURL()||"https://cdn.discordapp.com/embed/avatars/0.png"
    },
    timestamp: new Date()
  }];

  if(message.reference?.messageId){
    const replyWebhook = new WebhookClient({id: global.find(g=>g.channel === message.channel.id).id, token: global.find(g=>g.channel === message.channel.id).token});
    const replyWebhookMessage = await fetchWebhookMessage(replyWebhook,message.reference.messageId);
    if(replyWebhookMessage){
      embed[0].fields = [
        {
          name: "\u200b",
          value: `**${replyWebhookMessage.embeds[0].author?.name||"不明"}>>** ${replyWebhookMessage.embeds[0].description||"なし"}`
        }
      ];
    }else{
      const replyMessage = await fetchMessage(message.channel,message.reference.messageId);
      if(replyMessage){
        embed[0].fields = [
          {
            name: "\u200b",
            value: `**${replyMessage.author.tag}>>** ${parseMessage(replyMessage.content||"なし")}`
          }
        ];
      }
    }
  }

  const attachment = message.attachments.first();
  if(attachment){
    if(attachment.height&&attachment.width){
      embed.push({
        color: color,
        title: attachment.name,
        description: `[ファイルを開く](${attachment.url})`,
        image:{
          url: attachment.url
        }
      });
    }else{
      embed.push({
        color: color,
        title: attachment.name,
        description: `[ファイルを開く](${attachment.url})`
      });
    }
  }

  global.forEach(async(data)=>{
    if(data.server === message.guild.id) return;

    try{
      const webhook = await message.client.fetchWebhook(data.id,data.token);

      await webhook.send({
        embeds: embed,
        username: "TakasumiBOT Global",
        avatarURL: "https://cdn.takasumibot.com/images/icon.png"
      }).catch(()=>{});
    }catch(error){
      await db(`DELETE FROM global WHERE channel = ${data.channel};`);
      const channel = await fetchChannel(message.guild,data.channel);
      if(!channel) return;

      await channel.send({
        embeds:[{
          color: Colors.Red,
          author:{
            name: "グローバルチャットでエラーが発生しました",
            icon_url: "https://cdn.takasumibot.com/images/system/error.png"
          },
          description: "エラーが発生したため、強制的に切断されました\n再度登録するには`/global`を使用してください",
          fields:[
            {
              name: "エラーコード",
              value: `\`\`\`${error}\`\`\``
            }
          ]
        }],
        components:[
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link))
        ]
      }).catch(()=>{});
    }
  });

  await message.react("✅")
    .catch(()=>{});
}