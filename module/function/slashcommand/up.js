module.exports = async(interaction)=>{
  const { ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, Colors } = require("discord.js");
  const db = require("../../lib/db");
  const fetchInvite = require("../../lib/fetchInvite");
  if(!interaction.isChatInputCommand()) return;
  if(interaction.commandName === "up"){

    if(!interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionFlagsBits.CreateInstantInvite)) return await interaction.reply({
      embeds:[{
        color: Colors.Red,
        author:{
          name: "BOTに権限がありません",
          icon_url: "https://cdn.taka.cf/images/system/error.png"
        },
        description: "このコマンドはBOTに以下の権限が必要です",
        fields:[
          {
            name: "必要な権限",
            value: "```招待リンクの作成```"
          }
        ]
      }],
      ephemeral: true
    });

    const data = await db(`SELECT * FROM server WHERE id = ${interaction.guild.id} LIMIT 1;`);
    if(!data[0]) return await interaction.reply({
      embeds:[{
        color: Colors.Red,
        author:{
          name: "UPできませんでした",
          icon_url: "https://cdn.taka.cf/images/system/error.png"
        },
        description: "まだ登録されていません\n`/register`を使用して登録してください"
      }],
      ephemeral: true
    });

    if(!await fetchInvite(interaction.client,data[0].code)){
      try{
        await interaction.channel.createInvite({
          "unique": true,
          "maxAge": 0
        })
          .then(async(invite)=>{
            await db(`UPDATE server SET name = ${interaction.guild.name} members = ${interaction.guild.memberCount} code = "${invite.code}" WHERE id = ${interaction.guild.id}`);
          });
      }catch(error){
        await db(`DELETE FROM server WHERE id = ${interaction.guild.id};`);
        return await interaction.reply({
          embeds:[{
            color: Colors.Red,
            author:{
              name: "UPできませんでした",
              icon_url: "https://cdn.taka.cf/images/system/error.png"
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
                  .setURL("https://discord.gg/NEesRdGQwD")
                  .setStyle(ButtonStyle.Link))
          ],
          ephemeral: true
        });
      }
    }

    if(new Date()-new Date(data[0].time)<3600000) return await interaction.reply({
      embeds:[{
        color: Colors.Red,
        author:{
          name: "UPできませんでした",
          icon_url: "https://cdn.taka.cf/images/system/error.png"
        },
        description: "1時間に一回UPできます"
      }],
      ephemeral: true
    });

    await db(`UPDATE server SET name = ${interaction.guild.name} members = ${interaction.guild.memberCount} time = NOW() WHERE id = ${interaction.guild.id}`);
    await interaction.reply({
      embeds:[{
        color: Colors.Green,
        author:{
          name: "UPしました!",
          icon_url: "https://cdn.taka.cf/images/system/success.png"
        },
        description: "表示順位が更新されました"
      }]
    });
  }
}