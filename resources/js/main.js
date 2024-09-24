// SETTING SOME NEEDED GLOBAL VARS IN A 


// wrapping the main in an async function so it can await initialization data
async function main(){
  console.trace();
  //neutralino general code from sample
  /*    
  Function to handle the window close event by gracefully exiting the Neutralino application.
  */
  function onWindowClose() {
    Neutralino.app.exit();
  }

  var fpicker = document.getElementById('filepicker');
  fixFpick();
  var haudio = document.getElementById('haudio');

  // Establish datapath
  const data_path = await UTILS.getDataDir();

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
  <a href="#" class="repoclick">Visit us on Github</a>`

  // to prevent the link from opening in the app window, we must call os.open
  let repos = document.querySelectorAll('.repoclick');
  repos.forEach((el)=>{
    el.addEventListener("click", (e) => {
      Neutralino.os.open(APPVERSION.repo);
    });
  });
  /* END populate modal(s) */

  function catalogTabIndex() {
    let all_elements = Array.from(document.querySelectorAll(
      'a, button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));
    return all_elements;  
  }

  // init the all tabs var
  var allTabs;
  allTabs = catalogTabIndex();

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
  async function getFolderChoice(e){
    var caller = e.target || e.srcElement;
    console.log( caller );
    let folderChoice = await Neutralino.os.showFolderDialog(
      "Select folder to scan for sound files"
    );
    populatePickerController(folderChoice);
  }

  // set a GLOBAL variable for the tabindex;
  var allTabs = [];

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

    let ti = 20;
    
    files.forEach((fileinfo) => {
      ti+=1;
      fileshtml += `<button picker-path="${fileinfo.filepath}" picker-type="${fileinfo.filetype}" class="filename buttonlist" tabindex=${ti} >${fileinfo.filename}</button><br>`;
    });
    fpicker.innerHTML = fileshtml;
    new bootstrap.Tooltip("body", {
      selector: "[data-bs-toggle='tooltip']"
    });
    allTabs = catalogTabIndex();
  }

  //add clickability *once*
  fpicker.addEventListener("click",(e)=>{
    if(e.target.className.includes("filename")){
      playFile(e);
    }
  });
  fpicker.addEventListener("keydown",(e)=>{
  if(e.key == "Enter"){
    if(e.target.className.includes("filename")){
      aplayer.toggle_play(e);
    }
  }
  if(e.key == "ArrowDown" || e.key == "ArrowUp"){
    let direction = (e.key == "ArrowDown") ? 1 : -1;
    if(e.target.className.includes("typehere")){
      return;
    } else {
      e.preventDefault();
      focusNextElement(direction);
    }
  }
  });

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


  // establish keyboard controls
  document.addEventListener("keydown", (e)=>{
    if(document.activeElement.attributes.hasOwnProperty("typehere")) return;
    switch(e.key){
      case "space":
      case " ":
        aplayer.toggle_play(e);
        break;
      case "P":
      case "p":
        aplayer.toggle_pause();
        break;
      case "L":
      case "l":
        aplayer.toggle_loop();
      break;
    }
  });

  // move to next tabindex item (borrowed from: https://stackoverflow.com/questions/7208161/focus-next-element-in-tab-index)
  function focusNextElement(direction) {
    if (document.activeElement){
      let current = allTabs.indexOf(document.activeElement);
      if(allTabs[current].tabIndex > -1) {
        if(current.tabIndex === 0 && direction === -1) direction = 0;
        allTabs[current + direction].focus();
      }
    }
  }
}

main();
