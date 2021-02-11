module.exports = {
	name: 'addEpisode',
	short: 'ae',
	description: 'Add episode for a show.',
	execute(message, args, con, execFromCode){
		var shouldSendMessage = !execFromCode;
		var runQuery = function(query, handleResult){
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to add episode to **${args[0]}** show.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could add and episode nr **${args[1]}** to **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						if(handleResult){
							handleResult();
						} else {
							if(shouldSendMessage){
								message.channel.send(`Successfully added episode **${args[1]}** for show **${args[0]}** to the database.`);
							}
						}
					}
				}
			});
		}

		if(args.length > 1){
			var sql = `INSERT INTO episodes (show_id, number) VALUES (
			(SELECT id FROM shows WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'),
			'${args[1]}')`;
			if(args.length > 2){
				sql = `INSERT INTO episodes (show_id, number, url) VALUES (
				(SELECT id FROM shows WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'),
				'${args[1]}', '${args[2]}')`;
			}
			runQuery(sql);
		} else {
			message.channel.send('Please follw the `addEpisode` command with a name of the show you want to add episode for and the episode number and optionally an url.');
		}
	}
}