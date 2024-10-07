// IMPORTANT: REMEMBER THAT ANY FIELD INCLUDING PATHS IS STORED URIENCODED
// THIS PREVENTS BREAKING THE HTML DISPLAY OR WEIRDNESS IN RETRIEVING DB RECORDS

const MYDB = {  
  dbfile: "SamplesOrganizer.json", 
  db: {},
  samples: null,
  tagdata: null,
  ready: false,
  alltags: []
}

MYDB.dbInit = async () => {
  // initialize new loki
  let loki_adapter = new LokiFSAdapter();
  MYDB.db = new loki(MYDB.dbfile, {
    adapter: loki_adapter, 
    autoload: true,
    autoloadCallback : await MYDB.verifyCollections.bind(this),
    autosave: true, 
    autosaveInterval: 4000
  });        
}

MYDB.verifyCollections = async () => {
  console.log("verifying");
  MYDB.samples = await MYDB.db.getCollection("samples");
  if (MYDB.samples === null) {
    try{
      MYDB.samples = await MYDB.db.addCollection("samples",{
        unique: "filepath"
      });
    } catch (e) {
      UTILS.errorModal("The database 'samples' collection could not be opened/created. The error given was: ", e) ;
      throw("Samples collection could not be created!")
    }
    // creation didn't fail, so let's get it
    MYDB.samples = await MYDB.db.getCollection("samples");
  }

  MYDB.tagdata = await MYDB.db.getCollection("tagdata");
  if (MYDB.tagdata === null) {
    try{
      MYDB.tagdata = await MYDB.db.addCollection("tagdata",{
        unique: "tagname"
      });
    } catch {
      UTILS.error_modal("The database 'tagdata' collection could not be opened/created. The error given was: ", e);
      throw("tagdata collection could not be created!")
    }
    // creation didn't fail, so let's get it
    MYDB.tagdata = await MYDB.db.getCollection("tagdata");
  } 
  UTILS.goLive();
}

MYDB.addTag = async (tag) => {
  // check if tag exists, if not, add it
    let results = await MYDB.tagdata.find({'tagname': { '$eq' : tag.tagname }});
    if(results.length == 0){
      let d = await MYDB.tagdata.insert(tag);
      MYDB.alltags = await MYDB.getAllTags();
    } else {
      tag.meta = results[0].meta;
      tag.$loki = results[0].$loki;
      let d = await MYDB.tagdata.update(tag);
    }
    
}


MYDB.findOneFile = async (filepath) => {
  let results = await MYDB.samples.find({'filepath': { '$eq' : filepath }});
  if (results.length === 0) return false;
  return results[0];
}


MYDB.reconcile = async (current, dbentry) => {
  for(i in dbentry){
      if(current[i]){
      dbentry[i] = current[i];
      }
  }
  return dbentry;  
}


MYDB.addFile = async (fileinfo) => {
  // check if file exists, if so, update info and then update db. If not, add it
    let results = await MYDB.samples.find({'filepath': { '$eq' : fileinfo.filepath }});
    if(results.length == 0){
      let poppy = await MYDB.samples.insert(fileinfo);
    } else if(results.length === 1) {
//      if(fileinfo.filepath == results[0].filepath) console.log("WTAF"); simply for showing there was an existing file
      let update = await MYDB.reconcile(fileinfo,results[0]);
      let dupe = await MYDB.samples.update(update);
    } else {
      UTILS.errorModal("Could not add or update file in database. Better error info will appear in a future update");
    }    
}

MYDB.getAllTags = async () => {
  // returns all the recorded tagdata as an array
  let alltagdata = await MYDB.tagdata.find({});
  alltagdata.sort();
  return alltagdata;
}

MYDB.getTag = async (tagname) => {
  // get the entry for a single tag
  let tagdata = await MYDB.tagdata.find({"tagname": {$eq: tagname }});
  return tagdata;
}

MYDB.composeString = async (tag, typestr, value, values, val_is_array) => {
  console.log("making searchobj", tag, typestr, value, values, val_is_array);
  let searchObj = {};
  if(!val_is_array){
    console.log("making single". searchObj)
    searchObj[tag] = {};
    let snoo = searchObj[tag];
    console.log("okay", snoo)
    snoo[typestr] = value;
    console.log("whaa", searchObj)
  } else if(val_is_array){
    searchObj = {"$or":[]};
      values.forEach(myval =>{
        let newobj = {};
        newobj[tag]={};
        let snoo = newobj[tag]; // have to do this because newobj[tag][typestr] barfs
        snoo[typestr] = [].push(myval);
      searchObj["$or"].push(snoo);
    })
  }

  console.log("made");

  return searchObj;  

}

MYDB.prepSearch = async ( contentObject ) => {
  let tag = contentObject.field;
  let condition = contentObject.condition;
  let value = contentObject.value;
  if(value === "") {
    return null;
  }
  //value = encodeURI(value);
  let values = [];
  let val_is_array = false;
  if(value.includes(",")) {
    values = value.split(",");
    for(i in values){
      //trim whitespace from each entry
      values[i]=values[i].trim();
    } 
    val_is_array = true;
  } else {
    value = [value];
  }

  typestr = "";
  switch(condition){
    case ("is"):
      typestr = "$eq"
      break;
    case ("isnot"):
      typestr = "$neq"
      break;
    case ("contains"):
      typestr = "$containsAny"
      break;
    case ("containsnot"):
      typestr = "$containsNone"
      break;           
  }

  let searchObj = await MYDB.composeString(tag, typestr, value, values, val_is_array);
  return searchObj;
}


MYDB.results_temp = [];
let res_counter = 0;

MYDB.prepResults = async (results) => {
  MYDB.results_temp = [];
  let results_pane = document.getElementById("searchpicker");
  results_pane.innerHTML = "";
  results.forEach(result =>{
    res_counter++;
    let entry = result;
    MYDB.results_temp.push(entry);
    results_pane.innerHTML += res_counter.toString() +": " + result.filename +"<br>";
  })

}

MYDB.move_to_browse = () => {
  document.getElementById("filepicker").innerHTML = "";
  filedata.populatePicker(MYDB.results_temp);
  aplayer.toggleScreens({target:{
      id: "browse_top"
    }
  });
}

document.getElementById("pushToBrowse").addEventListener('click',MYDB.move_to_browse);



MYDB.searchByForm = async () => {
  //iterate through child nodes of the searchform div using querySelector to get the values of the individual elements;
  // $containsAny, $containsNone for tags - these are specific for arrays (val must be arrah)
  // $in, $nin for contains/doesn't contain on other fields 
  let searchform = [
    {"field": "filename",
      "condition": document.getElementById("search_filenametype").value,
      "value": document.getElementById("search_filenameval").value},
    {"field": "creator",
      "condition": document.getElementById("search_creatortype").value,
      "value": document.getElementById("search_creatorval").value},
    {"field": "licenses",
      "condition": document.getElementById("search_licensetype").value,
      "value": document.getElementById("search_licenseval").value},    
    {"field": "comments",
      "condition": document.getElementById("search_commenttype").value,
      "value": document.getElementById("search_commentval").value},   
    {"field": "tags",
      "condition": "contains",
      "value": document.getElementById("search_tags_contain").value},   
    {"field": "tags",
      "condition": "containsnot",
      "value": document.getElementById("search_tags_dont_contain").value},   
  ];
  
  let query = {"$and":[]};
  searchform.forEach(async contentObject => {
    let retval = await MYDB.prepSearch(contentObject);
    if(retval !== null) query["$and"].push(retval); 
  })
  let m = await UTILS.sleep(500);

  let search_results = await MYDB.samples.find(query);
  MYDB.prepResults(search_results);

}
document.getElementById("startsearch").addEventListener('click',MYDB.searchByForm);

let myreg = /th[ia]/i;

let qtest = async () =>{
  let search = {"$and":[
      ]};
    search["$and"].push({"filename": {'$containsAny': ["110"]}})
//    search["$and"].push({'tags': {'$containsNone': ["11","Unknown BPM"]}});
//    search["$and"].push();
    console.dir(search);
    console.dir(MYDB.samples.find(search));

}
document.getElementById("quickie").addEventListener('click',qtest);


MYDB.populateTagData = async () => {
  // a startup function that populates the tags collection with the contents
  // of the STARTUP_TAGS array in constants.js 
    let tagdata = MYDB.tagdata;
    for(let i in STARTUP_TAGS){
      let newT = await newTag();
      newT.tagname = STARTUP_TAGS[i];
      MYDB.addTag(newT, false);
    }
}



class LokiFSAdapter {

  loadDatabase = async (dbname, callback) => {
    // using dbname, load the database from wherever your adapter expects it
    // create the full path
    let dbfile = data_path + dbname;
    let success;  
    // check if dbfile exists / create if not
    await this.checkDbFile(dbfile);
    try{
      var serializedDb = await Neutralino.filesystem.readFile(dbfile);
      success = true;
    } catch {
      success = false;
    }

    if (success) {
      callback(serializedDb);      
    }
    else {
      callback(new Error("There was a problem loading the database"));
    }
  }

  saveDatabase = async (dbname, dbstring, callback) => {
    // store the database, for MYDB. example to localstorage
    let dbfile = data_path + dbname;
    let success;  
    // check if dbfile exists / create if not
    await this.checkDbFile(dbfile);
    try{
      var serializedDb = Neutralino.filesystem.writeFile(dbfile, dbstring);
      success = true;
    } catch {
      success = false;
    }

    if (success) {
      callback(null);
    }
    else {
      callback(new Error("An error was encountered saving the " + dbname + " database."));
    }
  }


  async checkDbFile (dbfile) {
    try{
      let stats = await Neutralino.filesystem.getStats(dbfile);
      if(stats) return true;
    } catch (e) {
      try{
        await Neutralino.filesystem.writeFile(dbfile, '');
        return true;
      } catch {
        UTILS.errorModal("The database file is unwriteable. The error given was: ", dbfile);
        throw("Database could not be created!")
      }
    }
  }  
}

