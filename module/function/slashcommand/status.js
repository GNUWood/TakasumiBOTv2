module.exports = async(interaction)=>{
  const os = require("os");
  const { ButtonBuilder, ActionRowBuilder, ButtonStyle, Colors } = require("discord.js");
  const db = require("../../lib/db");
  const sign = require("../../lib/sign");
  const cpu = require("../../lib/cpu");
  const fetchGuildCounts = require("../../lib/fetchGuildCounts");
  const fetchUserCounts = require("../../lib/fetchUserCounts");
  const config = require("../../../config.json");
  require("dotenv").config();
  if(!interaction.isChatInputCommand()) return;
  if(interaction.commandName === "status"){

    await interaction.deferReply();
    try{
      await interaction.editReply({
        embeds:[{
          color: Colors.Blue,
          description: "計測中...",
          timestamp: new Date()
        }]
      });

      const account = await db("SELECT * FROM account;");
      const hiroyuki = await db("SELECT * FROM hiroyuki;");
      const global = await db("SELECT * FROM global;");

      const message = (await db(`SELECT SUM(message) as total FROM log WHERE time > DATE_SUB(NOW(),INTERVAL 1 DAY);`))[0].total;
      const command = (await db(`SELECT SUM(command) as total FROM log WHERE time > DATE_SUB(NOW(),INTERVAL 1 DAY);`))[0].total;

      const preMessage = (await db(`SELECT SUM(message) as total FROM log WHERE time BETWEEN DATE_SUB(NOW(),INTERVAL 2 DAY) AND DATE_SUB(NOW(),INTERVAL 1 DAY);`))[0].total;
      const preCommand = (await db(`SELECT SUM(command) as total FROM log WHERE time BETWEEN DATE_SUB(NOW(),INTERVAL 2 DAY) AND DATE_SUB(NOW(),INTERVAL 1 DAY);`))[0].total;

      const guild = await fetchGuildCounts(interaction.client) - (await db(`SELECT guild FROM log WHERE time > DATE_SUB(NOW(),INTERVAL 1 DAY) ORDER BY time;`))[0].guild;
      const user = await fetchUserCounts(interaction.client) - (await db(`SELECT user FROM log WHERE time > DATE_SUB(NOW(),INTERVAL 1 DAY) ORDER BY time;`))[0].user;

      const totalAmount = (await db(`SELECT SUM(amount) as total FROM money;`))[0].total;
      const totalStock = (await db(`SELECT SUM(stock) as total FROM money;`))[0].total;
      const treasury = (await db(`SELECT * FROM count WHERE id = ${process.env.ID};`))[0].treasury;
      const historyAmount = (await db(`SELECT SUM(amount) as total FROM history WHERE time > DATE_SUB(NOW(),INTERVAL 1 DAY);`))[0].total;

      await interaction.editReply({
        embeds:[{
          color: Colors.Blue,
          title: "ステータス",
          fields:[
            {
              name: "システム",
              value: `OS: ${os.version()}(${os.type()}) ${os.arch()}\nCPU: ${await cpu()}%\nメモリ: ${100 - Math.floor((os.freemem() / os.totalmem()) * 100)}%`
            },
            {
              name: "Discord",
              value: `Ping: ${interaction.client.ws.ping}㍉秒\nコマンド数: ${(await interaction.client.application.commands.fetch()).size}個\nGC登録数: ${global.length} / ${await fetchGuildCounts(interaction.client)} (${Math.round(global.length/await fetchGuildCounts(interaction.client)*100)}%)\nひろゆき登録数: ${hiroyuki.length}\nTakasumiBOT Account: ${account.length}人\nサーバー稼働時間: ${Math.round(os.uptime() / 60)}分(BOT: ${Math.round(process.uptime() / 60)}分)`
            },
            {
              name: "統計データ",
              value: `サーバー数: ${await fetchGuildCounts(interaction.client)}サーバー\nユーザー数: ${await fetchUserCounts(interaction.client)}人\nサーバー増減数: ${sign(guild)}サーバー\nユーザー増減数: ${sign(user)}人\n\n過去24時間のメッセージ数: ${message}回\n過去24時間のコマンド実行数: ${command}回\n過去24時間とのメッセージ増減数: ${sign(message - preMessage)}回\n過去24時間とのコマンド増減数: ${sign(command - preCommand)}回`
            },
            {
              name: "経済",
              value: `財産合計: ${totalAmount}コイン\n株合計: ${totalStock}株\n国庫: ${treasury}コイン\n動いた金額: ${historyAmount}コイン`
            }
          ],
          timestamp: new Date()
        }],
        components:[
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link))
        ]
      });
    }catch(error){
      await interaction.editReply({
        embeds:[{
          color: Colors.Red,
          author:{
            name: "取得できませんでした",
            icon_url: "https://cdn.takasumibot.com/images/system/error.png"
          },
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
        ],
        ephemeral: true
      });
    }
  }
}