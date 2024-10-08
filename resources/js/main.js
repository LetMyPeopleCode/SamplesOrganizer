// SETTING SOME NEEDED GLOBAL VARS IN A 


// wrapping the main in an async function so it can await initialization data
async function main(){

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

  aplayer.catalogTabIndex = async () => {
    let all_elements = Array.from(document.querySelectorAll(
      'a, button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));
    return all_elements;  
  }

  // init the all tabs var
  aplayer.allTabs = await aplayer.catalogTabIndex();

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
  aplayer.toggleScreens = (e) =>{
    console.log("toggling");
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

  // START screen switching
  const nav_buttons = ["browse_top","search_top","settings_top"];
  const nav_screens = ["browse_screen","search_screen","settings_screen"];
  nav_buttons.forEach((element) => {
    document.getElementById(element).addEventListener("click",aplayer.toggleScreens)
  })


  // END screen switching

  //START filepicker
  /* The filepicker has two functions, to browse your drive for supported sound files and make them clickable to play in the player */

  // activate the open folder button
  let openFolderBtn = document.getElementById("fp-open");
  openFolderBtn.addEventListener('click', getFolderChoice);

  //Get User Selection from button
  async function getFolderChoice(e){
    var caller = e.target || e.srcElement;
    let folderChoice = await Neutralino.os.showFolderDialog(
      "Select folder to scan for sound files"
    );
    populatePickerController(folderChoice);
  }

  // set a GLOBAL variable for the tabindex;
  aplayer.allTabs = [];

  // Populate the picker
  async function populatePickerController(folderChoice){
    let fs = Neutralino.filesystem;
    let pathinfo = null;
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
    filedata.folderChoice = folderChoice;
    //read the files in the directory and all its subs
    let rawfiles = await fs.readDirectory(folderChoice, {recursive: true});
    //send them off for sorting (returns list of file objects)
  //MAX FILE OBJECTS: truncate array to this length if higher
    if (rawfiles.length > 5000) { 
      UTILS.errorModal(`For performance reasons, we only process the first ${MAXOBJS} entries returned from reading a folder and its subfolders. Entries can be any file or subdirectory. The directory chosen has more entries in it and/or it's subdirectories than that and will be truncated to ${MAXOBJS} entries. Entries may not be sound files, so it's possible far fewer sounds than the maximum object amount will be populated for browsing.`);
      rawfiles.length = MAXOBJS;
    }
    let files = await filedata.parseFiles(rawfiles);
    let waiter = await filedata.populatePicker(files)
    aplayer.allTabs = await aplayer.catalogTabIndex();

  }

  //add clickability *once*
  fpicker.addEventListener("click",(e)=>{
    if(e.target.className.includes("filename")){
      filedata.populateFile(e);
      playFile(e);
    }
  });
  fpicker.addEventListener("keydown",(e)=>{
  if(e.key == "Enter"){
    if(e.target.className.includes("filename")){
      filedata.populateFile(e);
      playFile(e);
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

  // SET UP LICENSE CHOOSER

  document.getElementById("select_license_source").addEventListener('click',getLicenseSource);

  async function getLicenseSource(){
    if(!filedata.folderChoice) filedata.folderChoice = await Neutralino.os.getPath('downloads');
    let chosenpath = await Neutralino.os.showOpenDialog('SELECT A LICENSE FILE', {
      defaultPath: filedata.folderChoice,
      filters: [
        {name: 'Possibles', extensions: ['txt', 'rtf', "doc", "docx", "pdf", "jpg", "png", "md"]},
        {name: 'All files', extensions: ['*']}
      ]
    });
    BROWSEFORM.license.value = chosenpath;
  }

  // SET UP LICENSE FOLDER VIEWER

  document.getElementById("viewlicense").addEventListener('click',viewLicense);

  async function viewLicense(){
    console.log("viewing");
    let licensepath = BROWSEFORM.license.value;
    console.log(licensepath);
    let pathstats;
    try {
      pathstats = await Neutralino.filesystem.getStats(licensepath);
    } catch (e) {
      UTILS.errorModal("The path is invalid. This means you may have (re)moved the directory or you may be using your own description instead of a path to the file.<br>&nbsp;<br>" + e);
      return;
    };

    console.log("path is valid");

    let pathparts = await Neutralino.filesystem.getPathParts(licensepath);
    let parentpath = "\"" + pathparts.parentPath + "\"";
    Neutralino.os.execCommand(`open ${parentpath}`);

    

  }

  // establish keyboard controls for player
  document.addEventListener("keydown", (e)=>{
    if(document.activeElement.attributes.hasOwnProperty("typehere")) return;
    e.preventDefault();
    //speed browsing - k == keep, s == skip
    if(aplayer.speedbrowse){
      if(e.key == "K" || e.key == "k"){
        keep_skip("keep");
      } else if (e.key == "S" || e.key == "s"){
        keep_skip("skip");
      }
    }
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
  async function focusNextElement(direction) {
    //aplayer.allTabs = await aplayer.catalogTabIndex();
    console.dir(aplayer.allTabs);
    if (document.activeElement){
      console.log(aplayer.allTabs);
      let current = aplayer.allTabs.indexOf(document.activeElement);
      if(aplayer.allTabs[current].tabIndex > -1) {
        if(current.tabIndex === 0 && direction === -1) direction = 0;
        aplayer.allTabs[current + direction].focus();
      }
    }
  }


  async function keep_skip(action){
    //removes pending-review from tags, adds the keep or leave tag, then calls save
    let tags;
    if(Array.isArray(filedata.currentSet[filedata.currentguid].tagstemp)){
      tags = filedata.currentSet[filedata.currentguid].tagstemp;
    } else {
      tags = JSON.parse(filedata.currentSet[filedata.currentguid].tagstemp);
    }
    let idxpending = tags.indexOf("pending review");
    let idxalt = (action === "keep") ? tags.indexOf("skip") : tags.indexOf("keep");
    if(idxpending > -1) tags.splice(idxpending,1);
    if(idxalt > -1) tags.splice(idxalt,1);
    if(tags.indexOf(action) === -1) tags.push(action);

    // populates the tag in the tag list
    filedata.currentSet[filedata.currentguid].tagstemp = tags
    filedata.populateTags(tags, filedata.currentguid);

    // saves the filedata
    let polka = await filedata.save(filedata.currentguid);  

    //select the next file in the list, circle back if there are no more
    let filearray =  Object.getOwnPropertyNames(filedata.currentSet);
    let curidx = filearray.indexOf(filedata.currentguid);
    if(curidx == -1){
      console.log("I'm fraking out here");
      return
    }

    if(curidx === (filearray.length - 1)) curidx = -1;
    // it's okay, it'll be 0 in the next line
    let nextfile_guid = filearray[curidx+1];
    
    let nextfile = document.querySelector(`[picker-guid = '${nextfile_guid}']`)
    let fakeEvent = new Event('click', {bubbles: true});
    fakeEvent.target = nextfile;
    nextfile.dispatchEvent(fakeEvent);
    
  }
}

main();
