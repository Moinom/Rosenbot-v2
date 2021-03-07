const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const config = require("./config.json");

client.on('ready', () => {

	const stream_channel = client.channels.cache.get(config.streamChannelID);
	var all_streamers = config.streamerNames;
	
	// loop through all the streamers in config and check their profiles
	function streamerLoop(){
		Object.keys(all_streamers).forEach(key => findStreamer(key, all_streamers[key]));
	}
	
	// collect stream info, starts announcer if stream is live
	async function checkStream(_streamData, _isOnline, _streamer){
		
		var status = _streamData.is_live; 
		var logo = _streamData.thumbnail_url;
		var title = _streamData.title;
		var gameID = _streamData.game_id;
		var game = await getGame(gameID).catch(e => { console.log(e) });

		// only run when online and not already announced
		if ((status != _isOnline) && (status)){
			
			all_streamers[_streamer] = true;
			announcer(_streamer, title, logo, game);

		// mark as offline after stream ended
		} else if (!status && _isOnline){
			all_streamers[_streamer] = false;
		}		
	}
	
	// find streamer profile from API
	async function findStreamer(_streamer, _isOnline) {

		const url = 'https://api.twitch.tv/helix/search/channels?query=' + _streamer;
		const streamObj = await apiCall(url)
		
		var data;
		for (let i in streamObj.data){
			if (streamObj.data[i].broadcaster_login == _streamer.toLowerCase()){
				data = streamObj.data[i];
				console.log(data)
			}
		}
		if (data != null){
			checkStream(data, _isOnline, _streamer)
		}
	}
	
	// find out game name
	async function getGame(_gameID){
		
		const url = "https://api.twitch.tv/helix/games?id=" + _gameID;
		const gameObj = await apiCall(url);
		
		var game = "";
		
		if (gameObj != null && gameObj != 0){
			game = gameObj.data[0].name;
		}
		return game
	}
	
	// generate auth token for API call
	async function getAuthToken(){

		const authResponse = await fetch(config.oAuthLink, {method: 'POST'});
		const authResJson = await authResponse.json();
		var token = await authResJson.access_token;

		return token
	}

	// get json object from API
	async function apiCall(_url){

		const token = await getAuthToken();
		var auth = {  
			method: 'GET',
			headers: { 
				'client-id': config.oAuthClientID, 
				'Authorization': 'Bearer ' + token
				} 
			}
		const response = await fetch(_url, auth);
		const obj = await response.json();

		return obj	
	}
	
	// announce in discord
	function announcer(_streamer, _title, _logo, _game){
		
		if (_game != null){
			_game = " " + _game;
		}

		stream_channel.send({
			content: "Attention, attention! Stream alert! :alarm_clock:",
			embed: {
			    color: 3447003,
			    author: {
			      name: _streamer,
			      icon_url: _logo
			    },
			    title: _streamer + " is now streaming"+ _game +"! Go and watch the stream!",
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
