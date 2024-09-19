/*
// this object lists the methods and properties for integrating the database of your choice
const DBInterface = {}
  constructor: {}, // initializes the database, makes sure it's running and configured as expected
  searchByTags: {}, // searches database based on one or more tags, returns array of file objects
}

const DBFileObject = {
  filename: "",
  filepath: "",
  filemetadata: {
    length: 0,
    filetype: "", // basically just the extension (mid, midi, wav, mp3, etc)
    creator: "",
    license: "", // name or description of the license
    licensepath: "", //path to a license file if available
    liked: false,
    deleted: false,
  }
  filetags: [];
};


class lokiDb {
  location; // directory where the file should exist, needs a trailing /
  filename; // the filename we'll use for persisting the db

  constructor (location = "~/.SamplesOrganizer", filename = "sorg.db"){
      this.location = location;
      this.filename = filename;
      //
  }


} */


/* =============================
EVERYTHING ABOVE IS APP CODE
EVERYTHING BELOW IS TEST CODE

We need to make sure we can use the Neutralino.filesystem API to build a
storage adapter for the app that uses the filesystem

We'll try to port the existing fs adapter for node first
Write one from scratch second

Save the file to ./SORGstorage in the app and try to find out where that goes
Make sure it persists the ability to pull and write data between compiles and runs


=============================== */

/**
     * A loki persistence adapter which persists using node fs module
     * @constructor LokiFsAdapter
     */
function LokiFsAdapter() {
  try {
    this.fs = require('fs');
  } catch (e) {
    this.fs = null;
  }
}

/**
 * loadDatabase() - Load data from file, will throw an error if the file does not exist
 * @param {string} dbname - the filename of the database to load
 * @param {function} callback - the callback to handle the result
 * @memberof LokiFsAdapter
 */
LokiFsAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
  var self = this;

  this.fs.stat(dbname, function (err, stats) {
    if (!err && stats.isFile()) {
      self.fs.readFile(dbname, {
        encoding: 'utf8'
      }, function readFileCallback(err, data) {
        if (err) {
          callback(new Error(err));
        } else {
          callback(data);
        }
      });
    }
    else {
      callback(null);
    }
  });
};

/**
 * saveDatabase() - save data to file, will throw an error if the file can't be saved
 * might want to expand this to avoid dataloss on partial save
 * @param {string} dbname - the filename of the database to load
 * @param {function} callback - the callback to handle the result
 * @memberof LokiFsAdapter
 */
LokiFsAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
  var self = this;
  var tmpdbname = dbname + '~';
  this.fs.writeFile(tmpdbname, dbstring, function writeFileCallback(err) {
    if (err) {
      callback(new Error(err));
    } else {
      self.fs.rename(tmpdbname, dbname, callback);
    }
  });
};

/**
 * deleteDatabase() - delete the database file, will throw an error if the
 * file can't be deleted
 * @param {string} dbname - the filename of the database to delete
 * @param {function} callback - the callback to handle the result
 * @memberof LokiFsAdapter
 */
LokiFsAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
  this.fs.unlink(dbname, function deleteDatabaseCallback(err) {
    if (err) {
      callback(new Error(err));
    } else {
      callback();
    }
  });
};

