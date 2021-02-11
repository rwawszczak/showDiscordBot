module.exports = {
	name: 'removeEpisode',
	short: 're',
	description: 'Remove episode of a show.',
	execute(message, args, con, execFromCode){
		var shouldSendMessage = !execFromCode;
		var runQuery = function(query, handleResult){
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to remove episode from **${args[0]}** show.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could remove and episode nr **${args[1]}** from **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						if(handleResult){
							handleResult();
						} else {
							if(shouldSendMessage){
								message.channel.send(`Successfully removed episode **${args[1]}** from show **${args[0]}**.`);
							}
						}
					}
				}
			});
		}

		if(args.length > 1){
			var sql = `DELETE FROM episodes WHERE show_id = 
			(SELECT id FROM shows WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}')
			AND number = ${args[1]}`;
			runQuery(sql);
		} else {
			message.channel.send('Please follw the `removeEpisode` command with a name of the show you want to remove episode from and the episode number.');
		}
	}
}