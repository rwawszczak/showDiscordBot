module.exports = {
	name: 'myShows',
	short: 'ms',
	description: 'Display saved shows.',
	async execute(message, args, con){
		var advanced = args.length > 0 && args[0] === 'advanced';
		var manage = args.length > 0 && args[0] === 'manage';
		var all = args.length > 0 && args[0] === 'all';
		var sql = `SELECT * FROM shows WHERE user='${message.author.username}#${message.author.discriminator}'`;

		const handleAsync = async function(message, text, show){
			var msg = await message.channel.send(text);
			msg.react('📔');
			msg.awaitReactions((reaction, user) => user.id == message.author.id && reaction.emoji.name == '📔',
                            { max: 1, time: 60000 }).then(collected => {
                                    if (collected.first().emoji.name == '📔') {
                                    	var archiveSql = `UPDATE shows SET archived='${show.archived ? 0 : 1}' WHERE id='${show.id}' AND user='${message.author.username}#${message.author.discriminator}'`;
                                    	con.query(archiveSql, function (err, result, fields) {
                                    		if(!err){
		                                    	if(!show.archived)
		                                            message.reply('Archiving '+show.show_name);
		                                        else
		                                            message.reply('Unrchiving '+show.show_name);
                                    		}
                                    	});
                                    }
                            }).catch(() => {
                                    //TODO: remove added reactions
                            });
		}

		con.query(sql, function (err, result, fields) {
			if (err) {
				message.channel.send('Something went wrong while trying fetch shows from the database.');
				throw err;
			}
			if(result.length == 0){
				message.channel.send('Currently you no shows saved. Use \`addShow\` command to add one.');
			} else {
				 var toSend = 'Currently you have saved following shows:';
				if(manage){
					message.channel.send(toSend);
				}
				for(var show of result){
					if(!show.archived || advanced || all || manage){
						if(manage){
							toSend ='';
						}
						if(!show.archived){
							toSend += `\n**${show.show_name}**`;
						} else {
							toSend += `\n_${show.show_name}_`;
						}
						if(advanced){
							toSend += ` *(id=${show.id})*`;
						}
						if(!!show.url){
							toSend += ` <${show.url}>`;
						}
						if(manage){
							handleAsync(message, toSend, show);
						}
					}
				}
				if(!manage){
					message.channel.send(toSend);
				} else {
					message.channel.send("That's it :slight_smile:");
				}
			}
		});
	}
}