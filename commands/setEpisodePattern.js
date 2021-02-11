module.exports = {
	name: 'setEpisodePattern',
	short: 'sep',
	description: 'Set an episode pattern for a show to be returned instead of default url.',
	execute(message, args, con){
		if(args.length > 1){
			var sql = `UPDATE shows SET episode_pattern='${args[1]}' WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to set episode pattern for **${args[0]}** show to the database.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could add episode pattern to **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						message.channel.send(`Successfully added episode pattern for show **${args[0]}** to the database.`);
					}
				}
			});
			
		} else {
			message.channel.send('Please follw the `setEpisodePattern` command with a name of the show you want to add pattern for and the pattern itself.');
		}
	}
}