module.exports = {
	name: 'setEpisodeInclude',
	short: 'sei',
	description: 'Set text that must be included in correct episode page.',
	execute(message, args, con){
		if(args.length > 1){
			var sql = `UPDATE shows SET episode_include='${args[1]}' WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to set episode text for **${args[0]}** show to the database.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could add episode text to **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						message.channel.send(`Successfully added episode include text for show **${args[0]}** to the database.`);
					}
				}
			});
			
		} else {
			message.channel.send('Please follw the `setEpisodeInclude` command with a name of the show you want to add text for and the text itself.');
		}
	}
}