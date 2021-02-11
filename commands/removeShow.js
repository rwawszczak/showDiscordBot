module.exports = {
	name: 'removeShow',
	short: 'removeShow',
	description: 'Remove a show.',
	execute(message, args, con){
		if(args.length > 0){
			var sql = `DELETE FROM shows WHERE show_name='${args[0]}' AND user='${message.author.username}#${message.author.discriminator}'`;
			con.query(sql, function (err, result) {
				if (err) {
					message.channel.send(`Something went wrong while trying to remove **${args[0]}** from the database.`);
					throw err;
				}
				if(result.affectedRows == 0){
					message.channel.send(`Could not remove **${args[0]}** from the database. Please use \`myShows\` command to check if you have saved show with that name.`);
				} else {
					message.channel.send(`Successfully removed **${args[0]}** show from  the database.`);
				}
			});
		} else {
			message.channel.send('Please follw the `removeShow` command with a name of the show you want to remove.');
		}
	}
}