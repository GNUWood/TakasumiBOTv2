module.exports = async(interaction)=>{
  const commnads = require("../../../file/commandlist");
  const gifts = require("../../../file/gifts");
  const config = require("../../../config.json");
  if(!interaction.isAutocomplete()) return;
  const focus = interaction.options.getFocused();

  if(interaction.commandName === "help"){
		const filter = Object.keys(commnads).filter(name=>name.startsWith(focus));
    if(filter.length > 25) return await interaction.respond([]);

		await interaction.respond(
			filter.map(name=>({ name: `${commnads[name].name}: ${commnads[name].description}`, value: name }))
		);
  }else if(interaction.commandName === "activity"){
    const filter = (await interaction.guild.members.fetch())
      .filter(member=>member.presence?.activities[0])
      .map(member=>member.presence.activities[0].name)
      .filter((activity,i,array)=>array.indexOf(activity) === i)
      .filter(name=>name.startsWith(focus));

    if(filter.length > 25) return await interaction.respond([]);

		await interaction.respond(
			filter.map(name=>({ name: name, value: name }))
		);
  }else if(interaction.commandName === "gift"){
    await interaction.respond(
      gifts
        .filter(gift=>gift.isBuy||interaction.user.id === config.admin)
        .map(gift=>({
          name: `${gift.id}コイン`,
          value: gift.id
        }))
		);
  }
}