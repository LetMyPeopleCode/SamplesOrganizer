const UTILS = {};
var data_path ='';

UTILS.arrayStringify = async (content) => {
  // for stringifying tag arrays for addition to the filepicker
  // should probably replace in next update with creating an array in memory
  // of files in the picker and just give the picker a file ID which is then
  // used to put data in the form.\
  console.log(content); content = JSON.stringify(content);
  content = content.replace("'[","[")
  content = content.replace("]'","]")
  moxie = content.replace(/\\/g,"");
  moxie = moxie.replace(/\"/g,"'");
  console.log(moxie); console.dir(JSON.parse(moxie));
  return moxie;
}

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
    await MYDB.dbInit();
  }
}

UTILS.goLive = async () => {
  //main();
  let populated = await MYDB.getTag("skipped");
  if(populated.length === 0){
    await MYDB.populateTagData();
  }
  MYDB.alltags = await MYDB.getAllTags();

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
  let dp_temp = '';
  try{
    let stats = await Neutralino.filesystem.getStats(app_path);
    if(stats) dp_temp = app_path;
  } catch (e) {
    try{
      let t = await Neutralino.filesystem.createDirectory(app_path);
      dp_temp = app_path;
    } catch(e) {
      UTILS.error_modal("The data directory for this app cannot be created. The error given was: ", e);
      throw("Data Dir could not be created!")
    }
  }
  return dp_temp;
}

/// AUTO RECOMMEND UTILITY



UTILS.searchPopulate = async (e) => {

  if(!(/[a-z]|[0-9]|\-| |\.|_/.test(e.key))){
    e.preventDefault();
  }
  if(/^[A-Z]+$/.test(e.key)){
    e.target.value = e.target.value + e.key.toLowerCase(); 
  }

  if((e.target.value !== "") && (autosearch.className !== "tagsearch_active")) { 
    UTILS.searchVisible(autosearch,"on")
  } else if(e.target.value === "") {
    UTILS.searchVisible(autosearch,"off")
  }  

  // find matches
    let posstags = [];
    MYDB.alltags.forEach(tag => {
      let tagval = tag.tagname; tagval = tagval.toLowerCase();
      if(tagval.includes(e.target.value)){
        posstags.push(tag)
      }
    });
    if (posstags.length === 0) {
      UTILS.searchVisible(autosearch,"off");
      return true;
    }
    posstags.sort();
    let posshtml = "";
    for(i in posstags){
      let thistag = posstags[i];
      posshtml += `<span class="addtag_browse"><button onclick="javascript:filedata.addTag(this, true);">${thistag.tagname}</button></span>\n`;
    }
    autosearch.innerHTML = posshtml;
    autosearch.style.height = "150px";

}


var autosearch = document.getElementById("autosearch");
// get content changes
document.getElementById('addtagbox').addEventListener('input', UTILS.searchPopulate)
// respond to enter
document.getElementById('addtagbox').addEventListener('keydown', (e) => {
  if(e.code === "Enter") filedata.addTag("Enter");
  if(!(/[a-z]|[0-9]|\-| |\.|_/.test(e.key))){
    e.preventDefault();
  }
  if((filedata.currentguid === undefined) || (filedata.currentguid === null) ){
    e.preventDefault();
    return;
  }
});


UTILS.searchVisible = (searchbox, action) => {
  searchbox.className = (action === "on") ? "tagsearch_active" : "tagsearch_inactive";
}

UTILS.quickGuid = async () => {
    // function from Google Gemini
    return 'sample:Sxxx-Oxxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

UTILS.addone = (e) => {
  console.log("adding");
  let proto_element = document.getElementById("originalAddSearch");
  let new_element = proto_element.cloneNode(true);
  let top_node = document.getElementById("searchform");
  let sibling = e.target.parentNode;
  new_element.id = "childish_gambino";
  new_element.removeAttribute("hidden");
  sibling.after(new_element);
//  top_node.appendChild(new_element);
  UTILS.linkadds();
}

UTILS.killone = (e) => {
  console.log("killing");
  let to_remove = e.target.parentNode;
  document.getElementById("searchform").removeChild(to_remove);

}
  
UTILS.linkadds = () =>{
  let adds = document.querySelectorAll("#addone");
  let kills = document.querySelectorAll("#killone");
  
  adds.forEach(mynode => {
    console.log(mynode);
    var old_element = mynode;
    var new_element = old_element.cloneNode(true);
    new_element.addEventListener('click', UTILS.addone);
    old_element.parentNode.replaceChild(new_element, old_element);    
  })

  kills.forEach(mynode => {
    console.log(mynode);
    var old_element = mynode;
    var new_element = old_element.cloneNode(true);
    new_element.addEventListener('click', UTILS.killone);
    old_element.parentNode.replaceChild(new_element, old_element);    
  })
  
}





