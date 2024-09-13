//neutralino general code from sample
/*    
Function to handle the window close event by gracefully exiting the Neutralino application.
*/
function onWindowClose() {
  Neutralino.app.exit();
}

// Initialize Neutralino
Neutralino.init();
var fpicker = document.getElementById('filepicker');
fixFpick();
var haudio = document.getElementById('haudio');


// Register event listeners
Neutralino.events.on("windowClose", onWindowClose);


//INITIALIZE TOOLTIPS VIA BOOTSTRAP
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// START Populate Modal(s)
// place any code to populate modals or handle their external urls here
/* About Modal - uses APPVERSION from constants.js */
let mbody = document.getElementById("abt-modal-body");

mbody.innerHTML = `<h3><b>SamplesOrganizer v${APPVERSION.num}</b></h3>
Released: ${APPVERSION.date}<br>
License: ${APPVERSION.license}<br>
${APPVERSION.copyright}<br>
<a href="#" id="repoclick">Visit us on Github</a>`

// to prevent the link from opening in the app window, we must call os.open
document.getElementById("repoclick").addEventListener("click", (e) => {
  Neutralino.os.open(APPVERSION.repo);
});
/* END populate modal(s) */

// START WINDOW RESIZE HANDLERS
// Using percentages in CSS for certain elements is not working well when they get filled with content.
// so let's try to use absolute values and use the DOM to handle sizing them.

var fpicker = document.getElementById('filepicker');
window.addEventListener("resize",fixFpick);
  
function fixFpick(){
  let winh = window.innerHeight; let winw = window.innerWidth;
  filepicker.style.height = Math.ceil(winh * .81).toString() +"px";
  filepicker.style.maxHeight = Math.ceil(winh * .9).toString() +"px";
  filepicker.style.width = Math.ceil(winw * .31).toString() +"px";
  filepicker.style.maxWidth = Math.ceil(winw * .35).toString() +"px";
}


// START APP CODE

// START screen switching
const nav_buttons = ["browse_top","search_top","settings_top","help_top"];
const nav_screens = ["browse_screen","search_screen","settings_screen","help_screen"];
nav_buttons.forEach((element) => {
  document.getElementById(element).addEventListener("click",toggleScreens)
})

function toggleScreens(e){
    alert("toggling");
  let my_button = e.target.id;
  let button_id = nav_buttons.indexOf(my_button);
  if(button_id < 0){
      alert("WTF"); return false;
  }
  for(let i = 0; i < nav_buttons.length; i++){
      let tgtscreen = document.getElementById(nav_screens[i]);
      let tgtbutton = document.getElementById(nav_buttons[i]);
      if(tgtscreen == null) console.log("no way", i);
      if(i === button_id){
          tgtscreen.removeAttribute("hidden");
          tgtbutton.className = "nav-link active"
      } else {
          tgtscreen.setAttribute("hidden","hidden");
          tgtbutton.className = "nav-link";
      }
  }
}
// END screen switching

//START filepicker
/* The filepicker has two functions, to browse your drive for supported sound files and make them clickable to play in the player */

// activate the open folder button
let openFolderBtn = document.getElementById("fp-open");
openFolderBtn.addEventListener('click', getFolderChoice);

//Get User Selection from button
async function getFolderChoice(){
  let folderChoice = await Neutralino.os.showFolderDialog(
    "Select folder to scan for sound files"
  );
  populatePickerController(folderChoice);
}

// Populate the picker
async function populatePickerController(folderChoice){
  let fs = Neutralino.filesystem;
  let pathinfo;
  // validate that the path passed is a directory
  try{
  pathinfo = await Neutralino.filesystem.getStats(folderChoice);
  } catch (e) {
    console.dir(e);
  }
  if(!pathinfo.isDirectory) {
    UTILS.errorModal("That directory does not seem to exist. Please select another directory.");
    return false;
  }
  //read the files in the directory and all its subs
  let files = await fs.readDirectory(folderChoice, {recursive: true});
  //send them off for sorting (returns list of file objects)
  files = await sortFiles(files);
  let fileshtml = "";
  let counter = 0;
  while (files.length < 1 && counter < 5){
    let strong = await UTILS.sleep(250);
    counter++;
  }
  
  files.forEach((fileinfo) => {
    fileshtml += `<a href="#" picker-path="${fileinfo.filepath}" picker-type="${fileinfo.filetype}" data-bs-toggle="tooltip" data-bs-title="${fileinfo.filename}" onclick="playFile" class="filename">${fileinfo.filename}</a><br>`;
  });
  fpicker.innerHTML = fileshtml;
  new bootstrap.Tooltip("body", {
    selector: "[data-bs-toggle='tooltip']"
  });
  //add clickability
  fpicker.addEventListener("click",(e)=>{
      if(e.target.className === "filename"){
        playFile(e);
      }
  });
}

// Sort through files before they populate into the picker returning ONLY the sounds
  // file entries come in entry (file name), path, and type values.
async function sortFiles(files){
  let sorted = [];
  files.forEach( async function(filedata){
    // throw out everything that's not a file;
    if(filedata.type !== "FILE") return;
    let parts = await Neutralino.filesystem.getPathParts(filedata.path);
    if(SOUNDEXT.indexOf(parts.extension) >= 0) sorted.push({"filepath": filedata.path, "filename": parts.filename, "filetype":parts.extension});
  });
  return sorted;
}

//media player functionality

async function playFile(e){
  console.log("clicked")
  console.dir(e.srcElement.attributes["picker-path"].value);
  let content = await Neutralino.filesystem.readBinaryFile(e.srcElement.attributes["picker-path"].value);
  let playable = await convertAudio(content);
  let mimeType = e.srcElement.attributes["picker-type"].value.replace('.','');
  let dataURI = `data:audio/${mimeType};base64,${playable}`;
  haudio.src = dataURI;
  //haudio.play();
  return;
}

async function convertAudio( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}