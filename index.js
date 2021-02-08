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
						var data;
						for (let i in pull.data){
							if (pull.data[i].broadcaster_login == streamer.toLowerCase()){
								data = pull.data[i];
							}
						}
						
						if (data != null){
							getStreamData(data, isOnline, streamer)
						}
				})
			})
	}
	
	function getStreamData(_streamData, _isOnline, _streamer){
		
		var status = _streamData.is_live; 
		var logo = _streamData.thumbnail_url;
		var title = _streamData.title;
		//var gameID = _streamData.game_id;
		//var game = getGame(gameID);
		console.log(_streamData)

		// only run when online and not already announced
		if ((status != _isOnline) && (status)){
			
			all_streamers[_streamer] = true;
			announcer(_streamer, title, logo);

		// mark as offline after stream ended
		} else if (!status && _isOnline){
			all_streamers[_streamer] = false;
		}		
	}
	
	/*
	function getGame(_gameID){
		var requestString = "https://api.twitch.tv/helix/games?id=" + _gameID;
		var game;
		
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
				fetch(requestString, auth)
					.then(res => res.json())
					.then(pull => {
						game = pull.data[0].name;
						//console.log(game)
						return game
				})
			})	
	} */
	
	function announcer(_streamer, _title, _logo){

		stream_channel.send({
			content: "Attention, attention! Stream alert! :alarm_clock:",
			embed: {
			    color: 3447003,
			    author: {
			      name: _streamer,
			      icon_url: _logo
			    },
			    title: _streamer + " is now streaming! Go and watch the stream!",
			    thumbnail: {
						url: _logo
					},
			    url: 'https://www.twitch.tv/' + _streamer,
			    description: _title		    
		    }
		});		
	}

	setInterval(streamerLoop, 30000);
});

client.login(config.token);
