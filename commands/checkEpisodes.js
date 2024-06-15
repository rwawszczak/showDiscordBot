const addEpisode = require('./addEpisode.js');
const removeEpisode = require('./removeEpisode.js');
const http = require('http');
const https = require('https');

module.exports = {
    name: 'checkEpisodes',
    short: 'ce',
    description: 'Check last available episode of a show.',
    execute(message, args, con) {
        // Helper function to handle reactions and update episode status
        const handleReactions = async (message, content, episode) => {
            try {
                const msg = await message.channel.send(content);
                if (episode.id) {
                    await msg.react('👁️');
                    const filter = (reaction, user) => user.id === message.author.id && reaction.emoji.name === '👁️';
                    const collected = await msg.awaitReactions({ filter, max: 1, time: 60000 });
                    if (collected.first().emoji.name === '👁️') {
                        const watchedSql = `UPDATE episodes SET watched=${episode.watched ? 0 : 1} WHERE id=${episode.id}`;
                        con.query(watchedSql, (err) => {
                            if (err) {
                                msg.reply('There was an error while trying to edit episode.');
                            } else {
                                msg.edit(content.replace(' *<watched>*', '').replace(':green_circle:', ' *<watched>*'));
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling reactions:', error);
            }
        };

        // Helper function to fetch content from a URL
        const fetchUrlContent = (url) => {
            return new Promise((resolve, reject) => {
                const client = url.startsWith('https') ? https : http;
                client.get(url, (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => { data += chunk; });
                    resp.on('end', () => { resolve(data); });
                }).on('error', (err) => { reject(err); });
            });
        };

        // Helper function to get the final link for the episode
        const getFinalLink = (previousLink, genericUrl, number) => {
            let finalLink = previousLink || genericUrl.replace('<number>', number - 1);
            if (!finalLink.startsWith('http')) finalLink = `http://${finalLink}`;
            return finalLink;
        };

        // Recursive function to check episodes
        const checkEpisodes = async (msgHandle, genericUrl, name, include, pattern, number, savedEpisodes, previousLink) => {
            const showAll = args.includes('all') || args.includes('unseen');
            const unseen = args.includes('unseen');
            const refresh = args.includes('refresh');

            if (showAll && number > 1) {
                const finalLink = getFinalLink(previousLink, genericUrl, number);
                const msgText = `**${number - 1}**: <${finalLink}>`;
                if (!unseen || !savedEpisodes.get(number - 1).watched) {
                    handleReactions(message, msgText, savedEpisodes.get(number - 1));
                }
            }

            if (!showAll && savedEpisodes.get(number - 1) && savedEpisodes.get(number - 2) && !savedEpisodes.get(number - 1).watched && savedEpisodes.get(number - 2).watched) {
                const currentLink = getFinalLink(previousLink, genericUrl, number);
                const msgText = `First not watched **${name}** episode is episode number **${number - 1}**:\n<${currentLink}>`;
                handleReactions(message, msgText, savedEpisodes.get(number - 1));
            }

            if (!refresh && savedEpisodes.has(number)) {
                checkEpisodes(msgHandle, genericUrl, name, include, pattern, number + 1, savedEpisodes, savedEpisodes.get(number).url);
                return;
            }

            const episodeUrl = genericUrl.replace('<number>', number);
            try {
                const result = await fetchUrlContent(episodeUrl);
                if (result.includes(include)) {
                    const msgText = showAll ? (unseen ? `List of unseen **${name}** episodes:` : `List of available **${name}** episodes:`) : `Checked **${name}** episodes 1 to ${number}...`;
                    msgHandle.edit(msgText);

                    let patternLink = pattern ? (result.match(pattern) || [])[1] : null;
                    const preparedUrl = patternLink || episodeUrl;
                    if (refresh && savedEpisodes.has(number)) removeEpisode.execute(message, [name, number, preparedUrl], con, true);
                    addEpisode.execute(message, [name, number, preparedUrl], con, true);

                    savedEpisodes.set(number, { url: preparedUrl, watched: false });
                    checkEpisodes(msgHandle, genericUrl, name, include, pattern, number + 1, savedEpisodes, patternLink);
                } else {
                    if (number > 1) {
                        if (!showAll) {
                            const finalLink = getFinalLink(previousLink, genericUrl, number);
                            msgHandle.delete();
                            if (savedEpisodes.get(number - 1).watched) {
                                const msgText = `Last available **${name}** episode is episode number **${number - 1}**:\n<${finalLink}>`;
                                handleReactions(message, msgText, savedEpisodes.get(number - 1));
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
            } catch (error) {
                console.error('Error fetching episode:', error);
            }
        };

        // Helper function to run SQL queries
        const runQuery = (sql, errorMsg, noResultsMsg, handleResult) => {
            con.query(sql, (err, result) => {
                if (err) {
                    message.channel.send(errorMsg);
                    throw err;
                }
                if (noResultsMsg && result.length === 0) {
                    message.channel.send(noResultsMsg);
                } else {
                    handleResult(result);
                }
            });
        };

        // Function to handle show data result
        const handleShowDataResult = (result) => {
            const selectEpisodesSql = `SELECT * FROM episodes WHERE show_id=${result[0].id}`;
            runQuery(selectEpisodesSql, 'Error fetching episodes.', false, (episodesResult) => {
                const savedEpisodes = new Map();
                episodesResult.forEach(epiRes => {
                    savedEpisodes.set(epiRes.number, { id: epiRes.id, url: epiRes.url, watched: epiRes.watched });
                });

                const genericEpisodeUrl = result[0].episode_url;
                message.channel.send(`Checking availability of **${result[0].show_name}** episodes...`).then(msgHandle => {
                    if (result[0].episode_include) {
                        checkEpisodes(msgHandle, genericEpisodeUrl, result[0].show_name, result[0].episode_include, result[0].episode_pattern, 1, savedEpisodes);
                    } else {
                        msgHandle.edit(`First set text that must be included on the page of **${result[0].show_name}** episode with \`setEpisodeInclude\` command.`);
                    }
                });
            });
        };

        // Function to handle show
        const handleShow = (show, username, discriminator) => {
            const showDataSql = `SELECT show_name, episode_url, episode_include, episode_pattern, id FROM shows WHERE show_name LIKE '%${show}%' AND user='${username}#${discriminator}' AND (archived = 0 OR archived IS NULL)`;
            const errorMsg = 'Something went wrong while trying to fetch show data from the database.';
            const noResultsMsg = `Currently, you have no shows that include ${show} in their name. Use \`addShow\` command to add one.`;

            runQuery(showDataSql, errorMsg, noResultsMsg, handleShowDataResult);
        };

        // Main execution logic
        if (args.length > 0) {
            const shows = args[0].split(',');
            shows.forEach(show => handleShow(show.trim(), message.author.username, message.author.discriminator));
        } else {
            message.channel.send('Please follow the `checkEpisodes` command with the name of the show you want to check episodes for.');
        }
    }
};
