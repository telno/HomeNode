//var nodemon = require('nodemon');
var https = require('https');
var urls = require('url');
var fs = require('fs');
var osascript = require('node-osascript');
var port = 4242;
var tlsOptions = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};

var printVal = function(val)
{
	val = (val == null) ? '' : val.toString().replace(/[\r\n]/g,'').substr(0,40);
	return val;
};

var printProps = function(obj)
{
  	for (var name in obj) {
    	console.log('\t-' + name + ' (' + (typeof obj[name]) + ')' + ': ' + printVal(obj[name]));
    }
};

var scripts = {
    getCurrentlyPlaying: "tell application \"iTunes\" \n if player state is playing then \n return artist of current track & \": \" & name of current track \n else \n return \"nothing playing\" \n end if \n end tell",
    playWhatever: "tell application \"iTunes\" to play \n return \"done\"",
    playPlaylist: "tell application \"iTunes\" to play user playlist userPlaylist \n return \"done\"",
    playArtist: fs.readFileSync('iTunesSearchResultsToPlaylist.applescript', { encoding: 'utf8' }),
    setItunesAirPlayBroadcast: fs.readFileSync('iTunesSetAirPlay.applescript', { encoding: 'utf8' }),
    setItunesVolume: fs.readFileSync('iTunesSetVolume.applescript', { encoding: 'utf8' }),
    setMute: "set volume with output muted \n return \"done\"",
    setUnmute: "set volume without output muted \n return \"done\"",
    getVolume: "output volume of (get volume settings) & output muted of (get volume settings)",
    setVolume: "if (output muted of (get volume settings)) then \n set volume with output muted output volume volumeLevel \n else \n set volume without output muted output volume volumeLevel \n end if \n return \"done\""
};

var operations = [
                  {
                  name: 'System Volume',
                  url: '/sysvolume/{value}',
                  values: [
                      { name: 'value', kind: 'range', min: 0, max: 100 }
                  ]
                  },
                  {
                  name: 'Play iTunes Artist Search',
                  url: '/play/artist/{value}',
                  values: [
                      { name: 'value', kind: 'text' }
                  ]
                  },
                  {
                  name: 'Set iTunes AirPlay Broadcast',
                  url: '/broadcast/{value}',
                  values: [
                  { name: 'value', kind: 'list', options: ['Yes','No'] }
                  ]
                  },
];

var doScriptThenDumpResultToResponse = function(script, res, vars) {
    var resp = res;
    if (!vars) vars = {};
    osascript.execute(
            script,
            vars,
            function(err, result, raw) {
                if (!err)
                      resp.write(result.toString());
                  else
                      resp.write(err.toString());
                resp.end();
            }
      );
};

https.createServer(
	tlsOptions,
	function (req, res) {
		console.log('Client requested ' + req.url);
  		res.writeHead(200, {'Content-Type': 'text/plain'});
        var url = urls.parse(req.url);
       var path = url.pathname ? url.pathname : '';
       var pathParts = path.split('/');
       while (pathParts.length < 2) { pathParts.push(''); }
       switch(pathParts[1].toLowerCase()) {
           case 'menu':
                   res.writeHead(200, {'Content-Type': 'application/json'});
                   res.write(JSON.stringify(operations));
                   res.end();
                   break;
           case 'sysvolume':
                   if (pathParts.length == 3)
                   {
                       switch (pathParts[2].toLowerCase())
                       {
                           case 'mute':
                                doScriptThenDumpResultToResponse(scripts.setMute, res);
                               break;
                           case 'unmute':
                                doScriptThenDumpResultToResponse(scripts.setUnmute, res);
                               break;
                           default:
                                    var vol = parseInt(pathParts[2]);
                                    if (vol >= 0 && vol <= 100)
                                    {
                                        doScriptThenDumpResultToResponse(scripts.setVolume, res, { volumeLevel: pathParts[2] });
                                    } else {
                                        res.write('invalid volume level (accept 0 to 100)');
                                        res.end();
                                    }
                       }
                   } else {
                    doScriptThenDumpResultToResponse(scripts.getVolume, res);
                   }
                   break;
           case 'itunesvolume':
                   if (pathParts.length == 3)
                   {
                       var vol = parseInt(pathParts[2]);
                       if (vol >= 0 && vol <= 100)
                       {
                           doScriptThenDumpResultToResponse(scripts.setItunesVolume, res, { volumeLevel: pathParts[2] });
                       } else {
                           res.write('invalid volume level (accept 0 to 100)');
                           res.end();
                       }
                   } else {
                       res.write('must specify volume level (accept 0 to 100)');
                       res.end();
                   }
                   break;
           case 'playing':
                   doScriptThenDumpResultToResponse(scripts.getCurrentlyPlaying, res);
                   break;
           case 'play':
                   if (pathParts.length == 4) {
                       var srchVal = decodeURI(pathParts[3]);
                       switch (pathParts[2].toLowerCase())
                       {
                           case 'playlist':
                               doScriptThenDumpResultToResponse(scripts.playPlaylist, res, { userPlaylist: srchVal });
                               break;
                           case 'artist':
                               doScriptThenDumpResultToResponse(scripts.playArtist, res, { searchValue: srchVal });
                               break;
                           default:
                               doScriptThenDumpResultToResponse(scripts.playWhatever, res);
                       }
                  
                   } else {
                       doScriptThenDumpResultToResponse(scripts.playWhatever, res);
                   }
                   break;
           case 'broadcast':
                   if (pathParts.length == 3) {
                       doScriptThenDumpResultToResponse(scripts.setItunesAirPlayBroadcast, res, { broadcast: pathParts[2].toLowerCase() });
                   } else {
                       res.write('invalid broadcast state specified');
                       res.end();
                   }
                   break;
           default:
                   res.write('Hello');
                   res.end();
       }
        
	}
).listen(port);

console.log('Server running on port ' + port);