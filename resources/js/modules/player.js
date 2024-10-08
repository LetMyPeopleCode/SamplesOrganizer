/* ----------- PLAYER CONTROLS ------------- */

// set up the audio players as their own object
const players = {}
//players.html = document.getElementById("hplayer");
// shim to let howler get new sources
Howl.prototype.changeSrc = function(newSrc) {
      var self = this;
      self.unload(true);
      self._duration = 0;
      self._sprite = {};
      self._src = newSrc;
      self.load();
}

players.html = new Howl({src:['demo/ringtone.mp3']});
players.midi = document.getElementById("mplayer");
players.html.on('load', (e) =>{
  aplayer.set_duration();
});

//map functions to common method names
//players.midi.play = function(){players.midi.start();}

// set up the player object
const aplayer = {
  play_status: false,
  pause_status: false,
  loop_status: false,
  autoplay: true,
  speedbrowse: false,
  current_player: players.html,
  current_player_id: "html",
  current_duration: 0, // the actual duration
};

BROWSEFORM.speed.addEventListener("click", ()=>{
  aplayer.speedbrowse = (BROWSEFORM.speed.checked) ? true : false;   
});
/* BROWSEFORM.autoplay.addEventListener("click", ()=>{
  console.log("autoplay clicked");
  aplayer.autoplay = (BROWSEFORM.autoplay.checked) ? true : false;   
});*/


//set up visible controls aliases
aplayer.play_button = document.getElementById('play_button');
aplayer.pause_button = document.getElementById('pause_button');
aplayer.loop_button = document.getElementById('loop_button');
aplayer.play_icon = document.getElementById('play_icon');
aplayer.pause_icon = document.getElementById('pause_icon');
aplayer.loop_icon = document.getElementById('loop_icon');
aplayer.clip_length = document.getElementById('clip_length');
aplayer.clip_progress = document.getElementById('clip_progress');
aplayer.clip_filename = document.getElementById('clip_filename');
  // fires once
  aplayer.clip_filename.innerText = "DEFAULT FILE: ringtone.mp3"

aplayer.toggle_play = (e = {}, rewind = false) => {
  //if there's nothing loaded ignore and return
  if(this.current_player === null) return false;
  // if the shift key is pressed while sending a play signal (button, space, enter), rewind
  if(e.shiftKey) {
    console.log("rewinding");
    aplayer.rewind();
    return;
  }
  aplayer.play_icon.src = "icons/player-playing.svg";
  aplayer.pause_icon.src = "icons/player-pause.svg";
  aplayer.pause_status = false;
  if(aplayer.play_status){
    aplayer.toggle_pause();
  } else {
    aplayer.play_status = true;
    aplayer.play();
  }
}

aplayer.rewind = () => {
  if(aplayer.current_player_id === "html"){
    aplayer.current_player.stop();
    aplayer.current_player.play();     
  } else if (aplayer.current_player_id === "midi"){
    aplayer.current_player.reload();
  }
  return;
}

aplayer.play = () => {
  aplayer.play_icon.src = "icons/player-playing.svg";
  if(aplayer.current_player_id === "midi") { 
    aplayer.current_player.start();
  } else if (aplayer.current_player_id === "html"){
    console.log("aplayer play")
    aplayer.play_status = true;
    aplayer.current_player.play();
    requestAnimationFrame(howlerUpdate);
  }
}

aplayer.pause = () =>{
  aplayer.play_status = false;
  aplayer.pause_icon.src = "icons/player-paused.svg";
  if(aplayer.current_player_id === "midi") { 
    aplayer.current_player.stop();
  } else if (aplayer.current_player_id === "html"){
    aplayer.current_player.pause();
  }
}

aplayer.toggle_pause = () => {
  // pause button clicked
 if (aplayer.pause_status === false) {
  aplayer.play_icon.src = "icons/player-play.svg";
  aplayer.pause_status = true;
  aplayer.pause_icon.src = "icons/player-paused.svg";
  aplayer.pause() 
 } else {
  aplayer.play_icon.src = "icons/player-playing.svg";
  aplayer.pause_icon.src = "icons/player-pause.svg";
  aplayer.pause_status = false;
  aplayer.play()
 }
}

aplayer.toggle_loop = () => {
  console.log("loop clicked");
  // loop button clicked
  if(aplayer.loop_status) {
    aplayer.loop_status = false;
    aplayer.loop_icon.src = "icons/player-loop.svg";
  } else {
    aplayer.loop_status = true;
    aplayer.loop_icon.src = "icons/player-looping.svg";    
  }
}

aplayer.play_end = () => {
  // do this when the playback completes
  console.log("ended");
  if(aplayer.current_player_id=="midi"){
    if(aplayer.duration > aplayer.current_player.currentTime) {
      aplayer.pause();
      return;
    }
  }
  if(aplayer.loop_status){
    // this may not work if reloading/rewinding is required
    // will need to test if they auto return to start on end
    aplayer.play_icon.src = "icons/player-playing.svg";
    aplayer.pause_status = false;
    aplayer.pause_icon.src = "icons/player-pause.svg";
    aplayer.play() 
  } else {
    aplayer.stop();
  }
}

aplayer.stop = () => {
  aplayer.play_icon.src = "icons/player-play.svg";
  aplayer.play_status = false;
  aplayer.pause_icon.src = "icons/player-pause.svg";
  aplayer.pause_status = false;
  aplayer.set_progress(0);
}

aplayer.set_duration = async () => { 
  // get the duration from the appropriate player
  var mytime;
  //technically we repeat ourselves below, but this is duped
  //in case we change or add players
  if(aplayer.current_player_id === "midi") {
    mytime = await aplayer.current_player.duration;
  } else {
    mytime = await aplayer.current_player.duration(0);
    // changing the song doesn't change the duration internally, so it stops early or late
    aplayer.current_player._duration = mytime;
  }
  if(mytime < 1) mytime = 1;

  aplayer.duration = mytime;
  aplayer.clip_length.innerText = await makeTimeString(mytime);
}

aplayer.set_progress = async (e) => {
  let current_time = 0;
  switch(typeof e){
    case("number"):
      current_time = e;
      break;
    default:
      current_time = aplayer.current_player.currentTime;
  }

  aplayer.clip_progress.innerText = makeTimeString(current_time);
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
players.midi.player_callback = aplayer.midiEventHandler;
players.html.on('end', aplayer.play_end);
players.midi.addEventListener('note', aplayer.set_progress);
players.midi.addEventListener('stop', aplayer.play_end )
players.midi.addEventListener('start', aplayer.set_duration);
players.midi.addEventListener('load', aplayer.play);

let count = 0;
// html player has no progress event
// therefore this is started by play and stopped by pause
// originally thought of leaving it running all the time, but
// that could mess with midi progress
function howlerUpdate() {
    // quit immediately if the player isn't currently playing
    if(aplayer.play_status){
//      console.log("hupdate", players.html.seek())
      aplayer.set_progress(players.html.seek());
      requestAnimationFrame(howlerUpdate);
    } else {
      //end the loop by doing bupkis
    }
}






/* ----------- PICKER FUNCTIONALITY ------------- */

async function playFile(e){
  //console.dir(players.html);

  //skip it if the file currently playing is the selected file and shift is not selected
  let parts = await Neutralino.filesystem.getPathParts(e.srcElement.attributes["picker-path"].value);
  if ((aplayer.clip_filename.innerText === parts.filename) && !e.shiftKey && aplayer.play_status) return;

  // just continue play if it's paused, no shift, and the same file
  if ((aplayer.clip_filename.innerText === parts.filename) && !e.shiftKey && aplayer.pause_status) aplayer.play();

  // BUTTON RESET (except loop)
  aplayer.pause_status = false;
  aplayer.play_status = false;
  aplayer.play_icon,src = "icons/player-play.svg";
  aplayer.pause_icon.src = "icons/player-pause.svg";

  // to handle possible URI encoding
  let ppath = decodeURI(e.srcElement.attributes["picker-path"].value);

  // get binary blob and determine mimetype based on file handle
  let filedata = await Neutralino.filesystem.readBinaryFile(ppath);
  let mimepre = SOUNDEXT.indexOf(parts.extension);
  let mimeType = SOUNDMIME[mimepre];

  //turn binary blob and mime type into a data URI
  let dataURI = await convertAudio(filedata, mimeType);

  if(mimeType == "midi") {    
    aplayer.current_player = players.midi;
    aplayer.current_player_id = "midi";
  } else {
    aplayer.current_player = players.html;
    aplayer.current_player_id = "html";
 //   players.html.unload();
    apnow = false;
    players.html.changeSrc([dataURI]);
    }

  // set the file name
  if(aplayer.autoplay) aplayer.play();
  aplayer.clip_filename.innerText = parts.filename;
  aplayer.set_duration()
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
