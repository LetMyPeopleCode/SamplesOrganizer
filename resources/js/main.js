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
  const nav_buttons = ["browse_top","search_top","settings_top"];
  const nav_screens = ["browse_screen","search_screen","settings_screen"];
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
    //read the files in the directory and all its subs
    let rawfiles = await fs.readDirectory(folderChoice, {recursive: true});
    //send them off for sorting (returns list of file objects)
  //MAX FILE OBJECTS: truncate array to this length if higher
    if (rawfiles.length > 5000) { 
      UTILS.errorModal(`For performance reasons, we only process the first ${MAXOBJS} entries returned from reading a folder and its subfolders. Entries can be any file or subdirectory. The directory chosen has more entries in it and/or it's subdirectories than that and will be truncated to ${MAXOBJS} entries. Entries may not be sound files, so it's possible far fewer sounds than the maximum object amount will be populated for browsing.`);
      rawfiles.length = MAXOBJS;
    }
    let files = await filedata.parseFiles(rawfiles);
    let fileshtml = "";
    let counter = 0;
/*
    while (files.length < 1 && counter < 5){
      console.log("waiting for filedata", files.length);
      let strong = await UTILS.sleep(250);
      counter++;
    }

    let ti = 20;
    
    counter = 0;
    while ((files[0].tagslength === 0) && counter < 50){
       console.log("waiting for tags")
       let strong = await UTILS.sleep(250);
       counter++;
     }
*/

    let ti = 20;
    filedata.currentSet = {};
    filedata.currentguid = null;
    filedata.clearForm();
    for (n in files) {
      let fileguid = await UTILS.quickGuid();
      //prevent collisions (despite a 1 in 74 quadrillion chance) Error message is just for fun.
      while(filedata.currentSet[fileguid]){
        UTILS.errorModal(`There was a rare collision on ID ${fileguid}, but we're fixing it.`)
        fileguid = await UTILS.quickGuid();
      }
      let fileinfo = files[n];
      ti+=1;
      filedata.currentSet[fileguid] = fileinfo;
      //let tags = await JSON.stringify(fileinfo.tags);
        // do we need to sanitize names/paths/etc?
      fileshtml += `<button picker-path="${fileinfo.filepath}" picker-type="${fileinfo.filetype}" picker-guid="${fileguid}" class="filename buttonlist" tabindex="${ti}">${fileinfo.filename}</button><br>`;
    }

    fpicker.innerHTML = fileshtml;
    new bootstrap.Tooltip("body", {
      selector: "[data-bs-toggle='tooltip']"
    });
    allTabs = catalogTabIndex();
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
  function focusNextElement(direction) {
    if (document.activeElement){
      let current = allTabs.indexOf(document.activeElement);
      if(allTabs[current].tabIndex > -1) {
        if(current.tabIndex === 0 && direction === -1) direction = 0;
        allTabs[current + direction].focus();
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
    filedata.currentSet[filedata.currentguid].tagstemp = JSON.stringify(tags)
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
