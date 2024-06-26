const properties = require('./properties.json')
const Discord = require('discord.js');
const mysql = require('mysql');

var con = null;

const getConnection = function() {
	var connection = mysql.createConnection({
		host: properties.dbhost,
		user: properties.dbuser,
		password: properties.dbpassword,
		database: properties.database
	});
	connection.on('error', err => {
		console.log('MYSQL error occured:');
		console.log(err.code);
		console.log(err);
		getConnection();
	});
	connection.connect(function(err) {
		if (err) throw err;
		console.log("Connected to database!");
	});
	con = connection;
}

getConnection();

const client = new Discord.Client();
const prefix = '!';
const fs = require('fs');

client.commands = new Discord.Collection();
client.shortCommands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
	client.shortCommands.set(command.short, command);
}

client.once('ready', () => {
	console.log('Animebot is online!');
});

var lastCommand;

client.on('message', message => {
	if(message.author.bot || (message.channel.type !== 'dm' && !message.content.startsWith(prefix)) ){
		return;
	}
	var content = message.content;
	var isDm = message.channel.type === 'dm';
	if(!isDm || content.startsWith(prefix)){
		content = content.slice(prefix.length);
	}

	const args = content.split(/ +/);
	const command = args.shift().toLowerCase();

	var commandDefinition = client.commands.get(command);
	if(!commandDefinition && isDm){
		commandDefinition = client.shortCommands.get(command);
	}
	if(!!commandDefinition){
		lastCommand = () => commandDefinition.execute(message, parseArgs(args), con);
		lastCommand();
	}	
	if(command === 'replay' || command === 'rp'){
		if(!!lastCommand){
			lastCommand();
		} else {
			message.channel.send("No previous command to be replayed.");
		}
	}
	if(command === 'commands'){
		var msg = 'Available commands:';
		for(cmd of client.commands){
			msg += `\n**${cmd[0]}** - *${cmd[1].description}*`
		}
		message.channel.send(msg);
	}
});

function parseArgs(args){
	var newArgs = [];
	var i = 0;
	while(i < args.length){
		if(!args[i].startsWith('"')){
			newArgs.push(args[i]);
			i++;
		} else {
			var j=i+1;
			var closingQuote = false;
			while(j < args.length && !closingQuote){
				if(args[j].endsWith('"') && !args[j].endsWith('\\"')){
					var quoted = args.slice(i,j+1).join(" ")
					quoted = quoted.substring(1,quoted.length-1).trim();
					if(quoted.length > 0){
						newArgs.push(quoted);
						i=j+1;
						closingQuote = true;
					}
				}
				j++;
			}
			if(!closingQuote){
				newArgs.push(args[i]);
				i++;
			}
		}
	}
	return newArgs;
}

client.login(properties.discordToken);
