const filedata = {};
const fs = Neutralino.filesystem;

filedata.parseFiles = async (dirbatch) => {
  //receives an array of all the paths from the recursive directory read
  // extracts poossible licenses, extracts file types, extracts BPM
  // returns array of fileinfo objects

  // STEP 1: remove non files
  let files = [];
  dirbatch.forEach(async function(filedata){
      // throw out everything that's not a file;
      if(filedata.type == "FILE"){
        let parts = await Neutralino.filesystem.getPathParts(filedata.path);
        let fileinfo = {
          "filepath": filedata.path, 
          "parentpath": parts.parentPath,
          "filename": parts.filename, 
          "filetype": parts.extension
        }
        files.push(fileinfo);
      }
    });

    // we need to figure this out, why are the async awaits still requiring us to wait for resolution of populating the files array?
   let counter = 0;
   while (files.length < 1 && counter < 50){
      let strong = await UTILS.sleep(250);
      counter++;
    }
     


    // STEP 2: alphabetize them by path
  files = await files.sort(async (a, b) => a.filepath - b.filepath);
    

  // STEP 3: Look for possible licenses
  let licreg = /(license)|(terms)|(licensing)|(read[ ]*me)|(credits)/i; // regex to spot potential license files
  let licenses = await files.filter(fobj => licreg.test(fobj.filepath))



  // STEP 4: remove all non sounds
  let soundreg = /(.wav$)|(.mid$)|(.mp3$)|(.mp4$)|(.aac$)|(.m4a$)|(.aac$)|(.flac$)|(.oga$)|(.ogg$)|(.caf$)|(.opus$)|(.weba$)|(.webm$)/i;


 let sounds = await files.filter(fname => soundreg.test(fname.filepath));
  

  // STEP 5: compare for licenses, extract possible bpm 
  await sounds.forEach(async sound => {
    
    // check if sound is in database and populate from DB entry, then continue


    // test against licenses array
    
    let possibles = [];
    //find out if it shares an ancestral path with a license
    if(licenses.length > 0){
      await licenses.forEach(ldata => {

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

    if(sound.licenses === undefined) sound.licenses ="tbd";
    // extract BPM if possible

    let bpmreg = /(\d{2,3})[-_ ]*BPM/i;
    let bpmfetch = await bpmreg.exec(sound.filepath);

    if(bpmfetch === null){
      bpmreg = /[\ -_](\d{2,3})[\ -_]/i;
      bpmfetch = await bpmreg.exec(sound.filepath);
    }
    if(bpmfetch !== null){
      sound.bpm = bpmfetch[1];
    } else {
      sound.bpm = 0;
    }
  })
  // STEP 6: return array for population into filepicker
   

  return sounds
}

filedata.populateFile = (element) =>{
  //populates the form with what we know or can guess


}

