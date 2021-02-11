module.exports = {
	name: 'setUrl',
	short: 'su',
	description: 'Set an url for a show.',
	execute(message, args, con){
		if(args.length > 1){
			var sql = `UPDATE shows SET url='${args[1]}' WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to add **${args[0]}** show to the database.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could add url to **${args[0]}** show. Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						message.channel.send(`Successfully added url for show **${args[0]}** to the database.`);
					}
				}
			});
		} else {
			message.channel.send('Please follw the `setUrl` command with a name of the show you want to add url for and the url.');
		}
	}
}