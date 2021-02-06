const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const config = require("./config.json");

client.on('ready', () => {

	const stream_channel = client.channels.cache.get(config.streamChannelID);
	var all_streamers = config.streamerNames;

	function streamerLoop(){
		Object.keys(all_streamers).forEach(key => pingTwitch(key, all_streamers[key]));
	}

	function pingTwitch(streamer, isOnline){

		// getting OAuth client credentials
		fetch(config.oAuthLink, {method: 'POST'})
			.then(res => res.json())
			.then(res => {

				// getting oAuth token
			    var token = res.access_token;

			    // authorisation info
			    var auth = {  
					method: 'GET',
					headers: { 
						'client-id': config.oAuthClientID, 
						'Authorization': 'Bearer ' + token
					} 
				}

				// fetch streamer channel
				fetch('https://api.twitch.tv/helix/search/channels?query='+ streamer, auth)
					.then(res => res.json())
					.then(pull => {

						var status = pull.data[0].is_live; 
						var logo = pull.data[0].thumbnail_url;
						var title = pull.data[0].title;
						console.log(pull.data)

						// only run when online and not already announced
						if ((status != isOnline) && (status)){
							all_streamers[streamer] = true;
							//announcer(streamer,title,logo)

						// mark as offline after stream ended
						} else if (!status && isOnline){
							all_streamers[streamer] = false;
						}
				})
			})
	}

	function announcer(streamer,title,logo){

		stream_channel.send({
			content: "@here Attention, attention! Stream alert! :alarm_clock:",
			embed: {
			    color: 3447003,
			    author: {
			      name: streamer,
			      icon_url: logo
			    },
			    title: streamer + " is now streaming! Go and watch the stream!",
			    thumbnail: {
						url: logo
					},
			    url: 'https://www.twitch.tv/' + streamer,
			    description: title		    
		    }
		});		
	}

	setInterval(streamerLoop, 30000);
});

client.login(config.token);