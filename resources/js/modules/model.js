class LocalDb {
  dbfile = "SamplesOrganizer.json"; 
  db = {};
  samples = null;
  tags = null;
  ready = false;
  self = this;

  constructor (){
  }

  async dbInit () {
    // initialize new loki
    let loki_adapter = new LokiFSAdapter();
    self.db = new loki(this.dbfile, {
      adapter: loki_adapter, 
      autoload: true,
      autoloadCallback : await this.verifyCollections,
      autosave: true, 
      autosaveInterval: 4000
    });        
  }

  async verifyCollections() {
    self.samples = await self.db.getCollection("samples");
    if (self.samples === null) {
      try{
        self.samples = await self.db.addCollection("samples");
      } catch (e) {
        UTILS.errorModal("The database 'samples' collection could not be opened/created. The error given was: ", e) ;
        throw("Samples collection could not be created!")
      }
      // creation didn't fail, so let's get it
      self.samples = await self.db.getCollection("samples");
    }
    console.log("samples collection loaded")

    self.tags = await self.db.getCollection("tags");
    if (self.tags === null) {
      try{
        self.tags = await self.db.addCollection("tags");
      } catch {
        UTILS.error_modal("The database 'tags' collection could not be opened/created. The error given was: ", e);
        throw("Tags collection could not be created!")
      }
      // creation didn't fail, so let's get it
      self.tags = await self.db.getCollection("samples");
    } 
    console.log("tags loaded")
    UTILS.goLive();
  }
  


}


class LokiFSAdapter {
  self = this;


  loadDatabase = async (dbname, callback) => {
    console.log("database loading")
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
      console.log("loki has loaded");
      callback(serializedDb);      
    }
    else {
      callback(new Error("There was a problem loading the database"));
    }
  }

  saveDatabase = async (dbname, dbstring, callback) => {
    // store the database, for this example to localstorage
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
    console.log("dbfile", dbfile);
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






/* ============================= 

  Loki Tests
  Let's make sure it works like I expect

  Okay, it works, but we're going to have to do a little magic to wait for the first loading of the DB


 ============================== */
