module.exports = {
	name: 'setGenericEpisodeUrl',
	short: 'sgeu',
	description: 'Set a generic episode url for a show.',
	execute(message, args, con){
		if(args.length > 1){
			if(args[1].includes("<number>")){
				var sql = `UPDATE shows SET episode_url='${args[1]}' WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
				con.query(sql, function (err, result) {
					if (err) {
						message.channel.send(`Something went wrong while trying to add episode url **${args[0]}** show to the database.`);
						throw err;
					} else {
						if(result.affectedRows == 0){
							message.channel.send(`Could add episode url to **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
						} else {
							message.channel.send(`Successfully added episode url for show **${args[0]}** to the database.`);
						}
					}
				});
			} else {
				message.channel.send('Generic episode url should contain "<number>" where episode number should appear for each episode.');
			}
		} else {
			message.channel.send('Please follw the `setGenericEpisodeUrl` command with a name of the show you want to add url for and the generic episode url.');
		}
	}
}