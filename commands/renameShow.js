module.exports = {
	name: 'renameShow',
	short: 'rs',
	description: 'Rename a show.',
	execute(message, args, con){
		if(args.length > 1){
			var sql = `UPDATE shows SET show_name='${args[1]}' WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to rename **${args[0]}** show.`);
					throw err;
				} else {
					if(result.affectedRows == 0){
						message.channel.send(`Could rename show **${args[0]}** . Please use \`myShows\` command to check if you have saved show with that name.`);
					} else {
						message.channel.send(`Successfully renamed show **${args[0]}** to **${args[1]}**.`);
					}
				}
			});
		} else {
			message.channel.send('Please follw the `renameShow` command with a name of the show you want to rename followed by its new name.');
		}
	}
}