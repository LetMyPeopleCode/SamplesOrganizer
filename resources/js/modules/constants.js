const APPVERSION = {
  "num": "0.1",
  "date": "September 30, 2024",
  "copyright": "Copyright ©2024 Greg Bulmash",
  "license" : "MIT",
  "repo": "https://github.com/LetMyPeopleCode/SamplesOrganizer"
}

//sound extensions this knows how to handle
// .mid and a few others to be added as we can find libraries to handle them
const SOUNDEXT = [".aac", ".mp3", ".mp4", ".wav", ".ogg", ".webm", ".3gpp", ".3gpp2",".mid",".m4a", ".flac", ".oga", ".caf", ".opus",".weba"];

const SOUNDMIME = ["aac", "mpeg", "mp4", "wav", "ogg", "webm", "3gpp", "3gpp2", "midi", "m4a", "flac", "ogg", "x-caf", "dolby", "ogg", "webm" ]


const STARTUP_TAGS = ["skipped","liked","rock","soul","jazz","edm","chill","trap","house", "90BPM","pending review","lo-fi","guitar","brass","one-shot","looping","sfx"];

const OPS_DATA = {};

const TagForm = {
  //the basic tag document for the db
  tagname: "", // a unique tag name
  tagdesc: "Describe this tag", // adding for possible future use
  tagcategory: "What word would you use to categorize this tag?" 
}

const newTag = async () => {
  let c = {
    //the basic tag document for the db
    tagname: "", // a unique tag name
    tagdesc: "", // adding for possible future use
    tagcategory: "" 
  }
  return c;
}

const newSound = async () => {
    let c = {   
      filepath: "",
      filetype: "",
      license: "",
      comments: "",
      creator: "",
      tags: [], // the full path with filename that's the unique identifier
//      metainfo: {} // no current use, but here for possible added details
  }
  return c;
}
 
const MAXOBJS = 5000; // maximum number of objects returned in the filepicker

const BROWSEFORM = {}
  BROWSEFORM.filename = document.getElementById("formfilename");
  BROWSEFORM.filepath = document.getElementById("formfilepath");
  BROWSEFORM.license = document.getElementById("formlicensepath");
  BROWSEFORM.comments = document.getElementById("formcomments");
  BROWSEFORM.creator = document.getElementById("formfilesource");
  BROWSEFORM.tags = document.getElementById("formfiletags");
  BROWSEFORM.speed = document.getElementById("speedbrowse");
  BROWSEFORM.autoplay = document.getElementById("autoplay");

    