module.exports = {
	name: 'checkEpisodes',
	short: 'ce',
	description: 'Check last availiable episode of a show.',
	execute(message, args, con){
        const addEpisode = require('./addEpisode.js');
        const removeEpisode = require('./removeEpisode.js');
        const unseen = !!args[1] && args[1] === 'unseen';
        const showAll = (!!args[1] && args[1] === 'all') || unseen;
        const refresh = !!args[1] && args[1] === 'refresh';

        const handleAsync = async function(message, text, episode){
        	var content = text + (episode.watched ? ' *<watched>*' : '') + (!episode.id ? ' **NEW!**' : '');
			var msg = await message.channel.send(content);
			if(episode.id){
				msg.react('👁️');
				msg.awaitReactions((reaction, user) => user.id == message.author.id && reaction.emoji.name == '👁️',
	                            { max: 1, time: 60000 }).then(collected => {
	                    if (collected.first().emoji.name == '👁️') {
	                    	var watchedSql = `UPDATE episodes SET watched='${episode.watched ? 0 : 1}' WHERE id='${episode.id}'`;
	                    	con.query(watchedSql, function (err, result, fields) {
	                    		if(!err){
	                            	if(!episode.watched)
	                                    msg.edit(text+' *<watched>*');
	                                else
	                                    msg.edit(text);
	                    		} else {
	                                msg.reply('There was an error while trying to edit episode.');
	                    		}
	                    	});
	                    }
	            }).catch(() => {
	                    //TODO: remove added reactions
	            });
        	}
		}
		
	    const getScript = (url) => {
            return new Promise((resolve, reject) => {
                const http      = require('http'),
                      https     = require('https');

                if (!url.toString().startsWith("http")) {
                    url = "http://"+url;
                }

                let client = http;

                if (url.toString().indexOf("https") === 0) {
                    client = https;
                }

                client.get(url, (resp) => {
                    let data = '';

                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        resolve(data);
                    });

                }).on("error", (err) => {
                    reject(err);
                });
            });
        };

        const getFinalLink = (previousLink, genericUrl, number) => {
        	var finalLink = !!previousLink ? previousLink : genericUrl.replace('<number>', number-1);
        	if(!finalLink.startsWith('http') && !finalLink.startsWith('www')){
        		finalLink = 'http://'+finalLink;
        	}
        	return finalLink;
        }

        const checkEpisodes = (msgHandle, genericUrl, name, include, pattern, number, savedEpisodes, previousLink) => { //TODO przerobiæ na promise'y
        
            if(showAll && number > 1){
                var finalLink = getFinalLink(previousLink, genericUrl, number);
                var msgText = `**${number-1}**: <${finalLink}>`;
                if(!unseen || !savedEpisodes.get(number-1).watched) {
                    handleAsync(message,msgText,savedEpisodes.get(number-1));
                }
            } 

            if(!showAll &&
            	savedEpisodes.get(number-1) &&
            	savedEpisodes.get(number-2) &&
            	!savedEpisodes.get(number-1).watched &&
            	savedEpisodes.get(number-2).watched){
	                var currentLink = getFinalLink(previousLink, genericUrl, number);
	                var msgText = `First not watched **${name}** episode is episode number **${number-1}**:\n<${currentLink}>`;
	    			handleAsync(message,msgText,savedEpisodes.get(number-1));
    		}

            if(!refresh && savedEpisodes.has(number)){
                checkEpisodes(msgHandle, genericUrl, name, include, pattern, number+1, savedEpisodes, savedEpisodes.get(number)['url']);
                return;
            }
            
            var episodeUrl = genericUrl.replace('<number>', number);
            getScript(episodeUrl).then(result => {
                if(result.includes(include)){
                    if(showAll){
                        if(unseen){
                            msgHandle.edit(`List of unseen **${name}** episodes:`);
                        } else {
                            msgHandle.edit(`List of availiable **${name}** episodes:`);
                        }
                    } else if(number % 10 === 0){
                        msgHandle.edit(`Checked **${name}** episodes 1 to ${number}...`);
                    }
                    var patternLink = null;
                    if(!pattern){
                    } else {
                        var matchResult = result.match(pattern);
                        if(matchResult && matchResult.length > 1){
                            patternLink = matchResult[1];
                        }
                    }
                    var preparedUrl = !!patternLink ? patternLink : genericUrl.replace('<number>', number);
                    var episodeArgs = [name, number, preparedUrl];
                    if(refresh && savedEpisodes.has(number)){
                    	removeEpisode.execute(message, episodeArgs, con, true);
                    }
                    addEpisode.execute(message, episodeArgs, con, true);
                    savedEpisodes.set(number, {url: preparedUrl, watched: false});

                    checkEpisodes(msgHandle, genericUrl, name, include, pattern, number+1, savedEpisodes, patternLink);
                } else {
                    if(number > 1){
                        if(!showAll){
                			var finalLink = getFinalLink(previousLink, genericUrl, number);
                            msgHandle.delete();

                            if(savedEpisodes.get(number-1).watched){
	                            var msgText = `Last availiable **${name}** episode is episode number **${number-1}**:\n<${finalLink}>`;
	                			handleAsync(message,msgText,savedEpisodes.get(number-1));
                			}
                        } else {
                            message.channel.send("That's it :slight_smile:").then(() => {
                            	msgHandle.edit(`List of available **${name}** episodes:`);
                            });
                        }
                    } else {
                        msgHandle.edit(`No **${name}** episodes available`);
                    }
                }
            });
        }

        const runQuery = (sql, errorMsg, noResultsMsg, handleResult) => {
            con.query(sql, function (err, result) {
			    if (err) {
				    message.channel.send(errorMsg);
				    throw err;
			    }
			    if(noResultsMsg && result.length == 0){
				    message.channel.send(noResultsMsg);
			    } else {
                    handleResult(result);
			    }
		    });
        }

        const handleShowDataResult = (result) => {
            var selectEpisodesSql = `SELECT * FROM episodes WHERE show_id=${result[0].id}`;
            runQuery(selectEpisodesSql, 'error', false, (episodesResult) =>{
                var savedEpisodes = new Map();
                for(epiRes of episodesResult){
                    savedEpisodes.set(epiRes['number'], {id: epiRes['id'], url: epiRes['url'], watched: epiRes['watched']} );
                }

                var genericEpisodeUrl = result[0].episode_url;
                var msg = message.channel.send(`Checking availability of **${result[0].show_name}** episodes...`);
                msg.then(msgHandle => {
                    if(!!result[0].episode_include){
                        checkEpisodes(msgHandle, genericEpisodeUrl, result[0].show_name, result[0].episode_include, result[0].episode_pattern, 1, savedEpisodes);
                    } else{
                        msgHandle.edit(`First set text that must be included on the page of **${result[0].show_name}** episode with \`setEpisodeInclude\` command.`);
                    }
                });

            });
        }

		if(args.length > 0){
            var showDataSql = `SELECT show_name, episode_url, episode_include, episode_pattern, id FROM shows WHERE show_name LIKE '%${args[0]}%' AND user='${message.author.username}#${message.author.discriminator}' AND (archived = 0 OR archived IS NULL)`;
            var errorMsg = 'Something went wrong while trying fetch show data from the database.';
            var noResultsMsg = `Currently you have no shows that include ${args[0]} in their name. Use \`addShow\` command to add one.`;
            
            runQuery(showDataSql, errorMsg, noResultsMsg, handleShowDataResult);
		} else {
			message.channel.send('Please follw the `checkEpisodes` command with a name of the show you want check episodes for.');
		}


	}
}