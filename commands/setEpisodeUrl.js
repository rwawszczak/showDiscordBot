module.exports = {
	name: 'setEpisodeUrl',
	short: 'seu',
	description: 'Set an url for an episode.',
	execute(message, args, con){
		if(args.length > 2){
			var sql = `UPDATE episodes SET url='${args[2]}' WHERE
			show_id=(SELECT id FROM shows WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}')
			AND number=${args[1]}`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to add episode url **${args[0]}** show to the database.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could not set episode url of **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						message.channel.send(`Successfully set episode url for show **${args[0]}** to the database.`);
					}
				}
			});
			
		} else {
			message.channel.send('Please follw the `setEpisodeUrl` command with a name of the show and episode number you want to add url for and the episode url.');
		}
	}
}