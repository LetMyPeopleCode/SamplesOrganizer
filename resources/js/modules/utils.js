const UTILS = {};
const MYDB = new LocalDb();
var data_path ='';

UTILS.errorModal = function(errorMsg){
  let mymodal;
  document.getElementById("err-modal-body").innerHTML = errorMsg;
  myModal = new bootstrap.Modal(document.getElementById('errorModal'), {})
  myModal.show();
}

UTILS.sleep = function(ms) {
    console.log ("sleeping " + ms.toString() + "ms");
    return new Promise(resolve => setTimeout(resolve, ms))
  }

UTILS.registerTC = async () => {
  let fileloc = await UTILS.getDataDir();
  try{
    await Neutralino.filesystem.writeFile(fileloc + 'tnc.txt','true');
  } catch(e) {
    UTILS.error_modal("Your agreement to the terms and conditions could not be recorded. The error given was: ", e);
    throw("Agreement could not be recorded!")
  }
  document.getElementById("termsandconditions").setAttribute("hidden","hidden");          
  document.getElementById("splash_screen").removeAttribute("hidden");
  return true;
}

UTILS.tcagree = async () => {
  await UTILS.registerTC();
  MYDB.dbInit();
}

UTILS.tcno = async () => {
  Neutralino.app.exit();
}

UTILS.checkAgree = async () => {
  let fileloc = await UTILS.getDataDir() + "tnc.txt";
  // make sure the basefile exists, and if not create it empty;
  try{
    let stats = await Neutralino.filesystem.getStats(fileloc);
  } catch (e) {
    try{
      await Neutralino.filesystem.writeFile(fileloc, '');
    } catch(e) {
      UTILS.errorModal("The app cannot write to disk. The error given was: ", e);
      throw("Database could not be created!")
    }
  }

  // try reading the file and checking the value
  let agreeval;
  try{
    agreeval = await Neutralino.filesystem.readFile(fileloc);
  } catch(e) {
    UTILS.errorModal("Your agreement to the terms and conditions could not be recorded. The error given was: ", e);
    throw("Agreement could not be recorded!")
  }
  if(agreeval === "true"){
    document.getElementById("termsandconditions").setAttribute("hidden","hidden");          
    document.getElementById("splash_screen").removeAttribute("hidden");
    return true;
  } else {
    return false;
  }
}

UTILS.launch = async () => {
  console.log("launch launched")
  data_path = await UTILS.getDataDir();
  // splash screen temporarily disabled
  document.getElementById("splash_screen").style.visibility = "none";    
  // check for whether the T&C has been accepted
  let agreed = await UTILS.checkAgree();
  if(!agreed) {
    console.log("showing T&C");
    document.getElementById("splash_screen").setAttribute("hidden","hidden")
    document.getElementById("main_app").setAttribute("hidden","hidden");
    document.getElementById("termsandconditions").removeAttribute("hidden");    
  } else {
    MYDB.dbInit();
  }
}

UTILS.goLive = () => {
  //main();
  setTimeout(function(){
    document.getElementById("termsandconditions").setAttribute("hidden","hidden");          
    document.getElementById("splash_screen").setAttribute("hidden","hidden");
    document.getElementById("main_app").removeAttribute("hidden");
  }, 500);
}    

// checks if the data directory has been created, makes it if not, returns path
UTILS.getDataDir = async () => {
  //use the OS API to get the native data path
  //for Mac, for example, it's /User/[username]/Library/Application Support
  let lib_path = await Neutralino.os.getPath("data");
  let app_path = lib_path + "/SamplesOrganizer/";
  try{
    let stats = await Neutralino.filesystem.getStats(app_path);
    if(stats) data_path = app_path;
  } catch (e) {
    try{
      await Neutralino.filesystem.createDirectory(app_path);
      data_path = app_path;
    } catch(e) {
      UTILS.error_modal("The data directory for this app cannot be created. The error given was: ", e);
      throw("Data Dir could not be created!")
    }
  }
  return data_path;
}


UTILS.filterPotentialLicenses = (pathstring) => {
  //reviews non-sound file names/paths for possible license documents, includes "distance" from file
  // Distance 0, in same folder, 1 parent folder, 2 grandparent folder, etc...
  // returns object with "possible" property, receiving function provides trues for selection 
}

UTILS.extractFileInfo = (pathstring) => {
  // reviews sound file names/paths for BPM, Genre, Instrument(s), Producer/source
  // returns object with that content, only inserting on first view 

}

