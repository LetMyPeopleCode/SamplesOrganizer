const filedata = {};
const fs = Neutralino.filesystem;
filedata.currentSet = {};


filedata.parseFiles = async (dirbatch) => {
  //receives an array of all the paths from the recursive directory read
  // extracts poossible licenses, extracts file types, extracts BPM
  // returns array of fileinfo objects

  // STEP 1: remove non files
  var files = [];
  let getDirBatch = async () => {
    for(let i in dirbatch){
        // throw out everything that's not a file;
        let filedata = dirbatch[i];
        if(filedata.type == "FILE"){
          let parts = await Neutralino.filesystem.getPathParts(filedata.path);
          let fileinfo = {
            "filepath": filedata.path, 
            "filename": parts.filename, 
            "filetype": parts.extension,
            "tags": [],
            "tagstemp":[], // a dupe of the tags for use in the tags box, so they repop in full if not saved
            "license": "",
            "comments": "",
            "creator": "",
          }
          files.push(fileinfo);
        }
      }
      return true;
    }
   // wrapping the array populator in an async function to await its completion and avoid the waiting loop
   let throwaway = await getDirBatch();


    // STEP 2: alphabetize them by path
  files = await files.sort(async (a, b) => a.filepath - b.filepath);
    

  // STEP 3: Look for possible licenses
  let licreg = /(license)|(terms)|(licensing)|(read[ ]*me)|(credits)/i; // regex to spot potential license files
  let licenses = await files.filter(fobj => licreg.test(fobj.filepath))



  // STEP 4: remove all non sounds
  let soundreg = /(.wav$)|(.mid$)|(.mp3$)|(.mp4$)|(.aac$)|(.m4a$)|(.aac$)|(.flac$)|(.oga$)|(.ogg$)|(.caf$)|(.opus$)|(.weba$)|(.webm$)/i;


 let sounds = await files.filter(fname => soundreg.test(fname.filepath));

  // STEP 5: compare for licenses, extract possible bpm 
  sounds.forEach(async sound => {
    
    // check if sound is in database and populate from DB entry, then continue
    let moo = sound.filepath;
    let filecheck = await MYDB.findOneFile(moo);

    if(filecheck){
      sound.tags = await JSON.stringify(filecheck.tags);
      sound.license = encodeURI(filecheck.license);
      sound.comments = encodeURI(filecheck.comments);
      sound.creator = encodeURI(filecheck.creator);
    } else {
      // test against licenses array
      
      let possibles = [];
      //find out if it shares an ancestral path with a license
      if(licenses.length > 0){
        let nuttin = await licenses.forEach(ldata => {

          let h = sound.filepath.replace(ldata.parentpath,'');
          if(h !== sound.path){
            possibles.push(ldata)
          }
        })
        if(possibles.length > 0) {
          sound.licenses = possibles[0].filepath;

        } else {
          sound.licenses = "TBD";
        } 
      }

      if(sound.licenses === undefined) sound.licenses ="TBD";
      
     
      // extract BPM if possible

      let bpmreg = /[\ \-_]?(\d{2,3})[-_ ]?BPM/i;
      let bpmfetch = await bpmreg.exec(sound.filepath);

      if(bpmfetch !== null){
        sound.bpm = bpmfetch[1];
      } else {
        sound.bpm = "Unknown ";
      }
      let bpmtag = sound.bpm + "BPM";
      sound.tags = ["pending review", bpmtag];

      // check if one shot
      let shotcheck = /one[-_\ ]{0,2}shot/i; //matches "one shot", "oneshot", "one_shot", "one-shot", "one__shot", etc
      if(shotcheck.test(sound.filepath)) sound.tags.push("one-shot");

      // store this with pending review
      let x = await MYDB.addFile(sound);
      filecheck = await MYDB.findOneFile(sound.path);
      //sound.meta = filecheck.meta;
      //sound.$loki = filecheck.$loki;
    }
  })
  // STEP 6: return array for population into filepicker
  return sounds
}

filedata.populateFile = async (element) =>{
  // grab our file guid (which changes each time we load the directory, thus we don't record it in the DB)
  let fileguid = element.srcElement.attributes["picker-guid"].value;
  element.srcElement.focus();
  let fileinfo = filedata.currentSet[fileguid];
  fileinfo.tagstemp = fileinfo.tags;
  filedata.currentguid = fileguid;

  //populates the form with what we know or can guess
  BROWSEFORM.filepath.value = decodeURI(element.srcElement.attributes["picker-path"].value);
  BROWSEFORM.filename.value = decodeURI(element.srcElement.innerText);
  BROWSEFORM.license.value = decodeURI(fileinfo.license);
  BROWSEFORM.comments.value = decodeURI(fileinfo.comments);
  BROWSEFORM.creator.value = decodeURI(fileinfo.creator);
  let filetags = fileinfo.tags;
  if(!Array.isArray(fileinfo.tags)) filetags = JSON.parse(fileinfo.tags);

  filedata.populateTags(filetags, fileguid);
  aplayer.allTabs = await aplayer.catalogTabIndex();

}

filedata.populateTags = (filetags, parentGUID) => {
  BROWSEFORM.tags.innerHTML = "";
  if(Array.isArray(filetags) && filetags.length > 0){
    for(let tagid in filetags){
      let tagname = filetags[tagid];
      if(tagname.length > 35){
        let tagdisplay = tagdisplay.substring(0,35) + "...";
      } else {
        tagdisplay = tagname;
      }
      // FOR LATER add a tooltip with the full tag value
      let taghtml = `<button class="tagbutton" tag-value="${tagname}" tag-guid="${parentGUID}">&nbsp;${tagdisplay}&nbsp;<a href="#" onclick="javascript:filedata.removeTag(this);">X</a>&nbsp;</button> `;
      BROWSEFORM.tags.innerHTML += taghtml;
    }
  }
}

filedata.removeTag = (e) => {
  let tagname = e.parentElement.attributes["tag-value"].value;
  let guid = e.parentElement.attributes["tag-guid"].value;

  let tagstemp = JSON.parse(filedata.currentSet[guid].tagstemp);
  let idx = tagstemp.indexOf(tagname);
  tagstemp.splice(idx,1);
  filedata.currentSet[guid].tagstemp = JSON.stringify(tagstemp)
  filedata.populateTags(tagstemp, guid);  
}

filedata.addTag = (e, isbutton=false) => {
  if((filedata.currentguid === undefined) || (filedata.currentguid === null)) return;
  let tagbox = document.getElementById("addtagbox");
  // validate value
  let tag;
  if(isbutton){
    tag = e.innerText;
  } else {
    tag = tagbox.value; 
  }
  let tags;
  if(Array.isArray(filedata.currentSet[filedata.currentguid].tags)){
    tags = filedata.currentSet[filedata.currentguid].tags;
  } else {
    tags = JSON.parse(filedata.currentSet[filedata.currentguid].tags);
  }
  tags.push(tag);
  tagstring = JSON.stringify(tags);
  filedata.currentSet[filedata.currentguid].tags = tagstring;
  filedata.currentSet[filedata.currentguid].tagstemp = tagstring; 
  filedata.populateTags(tags, filedata.currentguid);
  tagbox.value = "";
  UTILS.searchVisible(autosearch,"off");
}
document.getElementById("addTagButton").addEventListener("click",filedata.addTag);

filedata.save = async (guid = "") => {
  // gets data from the form and samples array and saves it to the database AND updates the currentSet 
  // if we implement clean/dirty, it resets the clean/dirty tag

  let storeme = await newSound();
  storeme.filename = encodeURI(BROWSEFORM.filename.value);
  storeme.filepath = encodeURI(BROWSEFORM.filepath.value);
  storeme.license = encodeURI(BROWSEFORM.license.value);
  storeme.comments = encodeURI(BROWSEFORM.comments.value);
  storeme.creator = encodeURI(BROWSEFORM.creator.value);
  storeme.tags = JSON.parse(filedata.currentSet[filedata.currentguid].tagstemp);
  storeme.bpm = filedata.currentSet[filedata.currentguid].speed;
 
  let pr = storeme.tags.indexOf("pending review");
  if(pr > -1) storeme.tags.splice(pr,1);

  let add = await MYDB.addFile(storeme);
  filedata.populateTags(storeme.tags, guid);

  // add new tags if needed
  let tts = [];
  for(i in storeme.tags){
    if(MYDB.alltags.indexOf(storeme.tags[i]) === -1) tts.push(storeme.tags[i]);
  }
  if(tts.length > 0){
    for(n in tts){
      let newT = await newTag();
      newT.tagname = tts[n];
      MYDB.addTag(newT, false);
    }
  }

  storeme.tagstemp = JSON.stringify(storeme.tags);
  storeme.tags = storeme.tagstemp;
  filedata.currentSet[filedata.currentguid] = storeme;

  // show saved message
  let saved = document.getElementById("savemsg");
  saved.style.display = "block";
  saved.style.opacity = 1;
  window.setTimeout(() => {
    saved.style.display = "none";    
  }, 3000);

}

document.getElementById("browse_savedata").addEventListener("click",filedata.save);

// add a clean/dirty function that says "you edited this file's data. would you like to save it before moving on?"
// changing an input field, adding or deleting a tag will make it dirty. Dirty then checks against the original data before saying "wanna save"?

filedata.addLicense = () => {
  // opens a file picker to choose a license file, populates field with file path.
}

filedata.clearForm = () => {
  BROWSEFORM.filename.value = "";
  BROWSEFORM.filepath.value = "";
  BROWSEFORM.license.innerText = ""; 
  BROWSEFORM.comments.value = "";
  BROWSEFORM.creator.value = "";
  BROWSEFORM.tags.innerHTML = "";
}

filedata.fixRecord = (fileinfo) => {

  if(fileinfo.filetype == "" | fileinfo.filetype == null){
    let fparts = Neutralino.filesystem.getPathParts(fileinfo.filepath);
  }

};

filedata.populatePicker = async (files) =>{
  files.sort((a,b) => {
    a.filename.localeCompare(b.filename);
  })
  //console.dir(files);
  let fpicker = document.getElementById("filepicker");
  let fileshtml = "";
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
    console.log("fileinfo", fileinfo)
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
  aplayer.allTabs = aplayer.catalogTabIndex();
  return true;
}