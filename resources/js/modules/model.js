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

MYDB.searchByForm = () => {
  //iterate through child nodes of the searchform div using querySelector to get the values of the individual elements;
  let myform = document.getElementById("searchform");
  let elements = myform.querySelectorAll(".searchel");
  elements.forEach(element => {
    let fieldval = element.querySelector(".fieldval").value;
    let fieldtype = element.querySelector(".fieldtype").value;
    let matchtype = element.querySelector(".matchtype").value;
    let boolean = "";
    try{
      boolean = element.querySelector(".searchboolean").value;
    } catch {
      boolean = null;
    }
        
    console.log (boolean, fieldtype, matchtype, fieldval);
  })


}
document.getElementById("startsearch").addEventListener('click',MYDB.searchByForm);



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

