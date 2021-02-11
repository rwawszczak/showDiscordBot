module.exports = {
	name: 'ping',
	short: 'ping',
	description: 'This is a ping command!',
	execute(message, args){
		message.channel.send('pong!');
		message.channel.send(args);
	}
}