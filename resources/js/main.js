//neutralino general code from sample
/*    
Function to handle the window close event by gracefully exiting the Neutralino application.
*/
function onWindowClose() {
  Neutralino.app.exit();
}

// Initialize Neutralino
Neutralino.init();

// Register event listeners
Neutralino.events.on("windowClose", onWindowClose);
alarm("does this work");

//INITIALIZE TOOLTIPS VIA BOOTSTRAP
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// START Populate Modal(s)
// place any code to populate modals or handle their external urls here
/* About Modal - uses APPVERSION from constants.js */
let mbody = document.getElementById("abt-modal-body");

mbody.innerHTML = `<h3>SamplesOrganizer v${APPVERSION.num}</h3>
Released: ${APPVERSION.date}<br>
License: ${APPVERSION.license}<br>
${APPVERSION.copyright}<br>
<a href="#" id="repoclick">Visit us on Github</a>
`

// to prevent the link from opening in the app window, we must call os.open
document.getElementById("repoclick").addEventListener("click", (e) => {
  Neutralino.os.open(APPVERSION.repo);
});
/* END populate modal(s) */






// START ORIGINAL APP CODE

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
 

}

