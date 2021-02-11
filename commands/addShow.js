module.exports = {
	name: 'addShow',
	short: 'as',
	description: 'Add a new show.',
	execute(message, args, con){
		if(args.length > 0){
			var sql = `INSERT INTO shows (show_name, user) VALUES ('${args[0]}', '${message.author.username}#${message.author.discriminator}')`;
			con.query(sql, function (err, result) {
				if (err) {
					if(err.code === 'ER_DUP_ENTRY'){
						message.channel.send(`You already have show with name **${args[0]}** saved in the database.`);
					} else {
						message.channel.send(`Something went wrong while trying to add **${args[0]}** show to the database.`);
						throw err;
					}
				} else {
					message.channel.send(`Successfully added **${args[0]}** show to the database.`);
				}
			});
		} else {
			message.channel.send('Please follw the `addShow` command with a name of the show you want to add.');
		}
	}
}