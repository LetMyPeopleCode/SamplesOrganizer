/* ----------- PLAYER CONTROLS ------------- */

// set up the audio players as their own object
const players = {}
players.html = document.getElementById("hplayer");
players.midi = document.getElementById("mplayer");

//map functions to common method names
//players.midi.play = function(){players.midi.start();}

// set up the player object
const aplayer = {
  play_status: false,
  pause_status: true,
  loop_status: false,
  current_player: players.html,
  current_player_id: "html",
  current_duration: 0, // the actual duration
};

//set up visible controls aliases
aplayer.play_button = document.getElementById('play_button');
aplayer.pause_button = document.getElementById('pause_button');
aplayer.loop_button = document.getElementById('loop_button');
aplayer.clip_length = document.getElementById('clip_length');
aplayer.clip_progress = document.getElementById('clip_progress');
aplayer.clip_filename = document.getElementById('clip_filename');


// aplayer statuses use false for off and true for on

/* different player control methods & events
  KEEP THIS FOR REFERENCE FOR NEW CONTRIBS
  html player: (HTML audio element)
    paused: property - "paused" - boolean
    play: method - play();
    rewind/loop: method - load();
    pause: method - pause();
    unpause: method - play();
    length: property - "duration" - (int in seconds);
    progress: event - "timeupdate" - val: current_player.currentTime - float in ms

  midi player: (https://github.com/cifkao/html-midi-player/tree/master)
    play: method - start();
    pause/stop: method - stop();
    unpause: start();
    restart: method - reload();
    length: property - "duration" - (float in ms?)
    progress: event - "note" - val: current_player.currentTime - float in ms?
    */

aplayer.midiNote = async (e) => {
   let myprog
   aplayer.set_progress(e.time);
}

aplayer.toggle_play = () => {
  console.log("play clicked");
  //if there's nothing loaded ignore and return
  if(this.current_player === null) return false;
  //
  if(aplayer.play_status){
    (aplayer.current_player_id === "midi") ? aplayer.current_player.reload() : aplayer.current_player.load();
    aplayer.play();
  } else {
    play_button.src = "icons/player-playing.svg";
    aplayer.pause_button.src = "icons/player-pause.svg";
    if(!aplayer.pause_status) 
    aplayer.pause_status = false;
    aplayer.play() 
  }
}

aplayer.rewind = () => {
  if(aplayer.current_player_id === "html"){
    aplayer.current_player.load()     
  } else if (aplayer.current_player_id === "midi"){
    aplayer.current_player.reload();
  }
}

aplayer.play = () => {
  if(aplayer.current_player_id === "midi") { 
    aplayer.current_player.start();
  } else if (aplayer.current_player_id === "html"){
    aplayer.current_player.play();
  }
}

aplayer.pause = () =>{
  if(aplayer.current_player_id === "midi") { 
    aplayer.current_player.stop();
  } else if (aplayer.current_player_id === "html"){
    aplayer.current_player.pause();
  }
}

aplayer.toggle_pause = () => {
  console.log("pause clicked");
  // pause button clicked
  play_button.src = "icons/player-play.svg";
  aplayer.pause_status = true;
  aplayer.pause_button.src = "icons/player-paused.svg";
  aplayer.pause() 
}

aplayer.toggle_loop = () => {
  console.log("loop clicked");
  // loop button clicked
  if(aplayer.loop_status) {
    aplayer.loop_status = false;
    aplayer.loop_button.src = "icons/player-loop.svg";
  } else {
    aplayer.loop_status = true;
    aplayer.loop_button.src = "icons/player-looping.svg";    
  }
}

aplayer.play_end = () => {
  // do this when the playback completes
  console.log("ended");
  if(aplayer.current_player_id=="midi"){
    if(aplayer.current_player.duration > aplayer.current_player.currentTime) {
      aplayer.toggle_pause();
      return;
    }
  }
  if(aplayer.loop_status){
    // this may not work if reloading/rewinding is required
    // will need to test if they auto return to start on end
    play_button.src = "icons/player-playing.svg";
    aplayer.pause_status = false;
    aplayer.pause_button.src = "icons/player-pause.svg";
    aplayer.play() 
  } else {
    aplayer.stop();
  }
}

aplayer.stop = () => {
  aplayer.play_button.src = "icons/player-play.svg";
  aplayer.play_status = false;
  aplayer.pause_button.src = "icons/player-pause.svg";
  aplayer.pause_status = false;
  aplayer.set_progress(0);
}

aplayer.set_duration = async () => { 
  console.log("setting duration")
  // get the duration from the appropriate player
  var mytime;
  //technically we repeat ourselves below, but this is duped
  //in case we change or add players
  if(aplayer.current_player_id === "midi") {
    mytime = await aplayer.current_player.duration;
  } else {
    mytime = await aplayer.current_player.duration;
  }
  console.log("mytime", mytime)
  if(mytime < 1) mytime = 1;

  aplayer.duration = mytime;
  aplayer.clip_length.innerText = await makeTimeString(mytime);
}

aplayer.set_progress = async (e) => {
  // update to min/sec and add to progress box 
  aplayer.clip_progress.innerText = makeTimeString(aplayer.current_player.currentTime);
}

aplayer.blankPlayers = async () => {
  //players.midi.stop();
  if(players.html.stop) players.html.stop();
  aplayer.stop();
  //aplayer.current_player = null;  
  return false;
}


function makeTimeString(mytime){
  let minutes = Math.floor(mytime / 60); //time/60 rounded down to int
  let seconds = Math.floor(mytime % 60); //remainder of time/60 rounded down to int.
  minutes = (minutes < 10) ? "0" + minutes.toString() : minutes.toString();
  seconds = (seconds < 10) ? "0" + seconds.toString() : seconds.toString();
  let timeString = minutes + ":" + seconds;
  return timeString;
}

// add the event listeners
// player button events
aplayer.play_button.addEventListener("click", aplayer.toggle_play);
aplayer.loop_button.addEventListener("click", aplayer.toggle_loop);
aplayer.pause_button.addEventListener("click", aplayer.toggle_pause);

//player events
//players.midi.player_callback = aplayer.midiEventHandler;
players.html.addEventListener('ended', aplayer.play_end);
players.html.addEventListener('durationchange', aplayer.set_duration);
players.html.addEventListener('loadedmetadata', aplayer.set_duration);
players.html.addEventListener('timeupdate', aplayer.set_progress);
players.midi.addEventListener('note', aplayer.set_progress);
players.midi.addEventListener('stop', aplayer.play_end )
players.midi.addEventListener('start', aplayer.set_duration);
players.midi.addEventListener('load', aplayer.play);


/* ----------- PICKER FUNCTIONALITY ------------- */

async function playFile(e){
  // get binary blob and determine mimetype
  let filedata = await Neutralino.filesystem.readBinaryFile(e.srcElement.attributes["picker-path"].value);
  let mimepre = SOUNDEXT.indexOf(e.srcElement.attributes["picker-type"].value);
  let mimeType = SOUNDMIME[mimepre];

  //turn binary blob and mime type into a data URI
  let dataURI = await convertAudio(filedata, mimeType);

  //let xwatch = await aplayer.blankPlayers();
  if(mimeType == "midi") {    
    aplayer.current_player = players.midi;
    aplayer.current_player_id = "midi";
  } else {
    aplayer.current_player = players.html;
    aplayer.current_player_id = "html";
  }

  // set the file name
  let parts = await Neutralino.filesystem.getPathParts(e.srcElement.attributes["picker-path"].value);
  aplayer.clip_filename.innerText = parts.filename;

  aplayer.current_player.src = dataURI;
  aplayer.toggle_play();
  aplayer.play();
}


async function convertAudio( buffer, mimeType ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    let playable = window.btoa( binary );
    let dataURI = `data:audio/${mimeType};base64,${playable}`;
    return dataURI;
}
