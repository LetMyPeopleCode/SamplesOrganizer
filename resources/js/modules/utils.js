const UTILS = {};

// Get a named environment variable
UTILS.getEnv = async function(myStr){
  let val = await Neutralino.os.getEnv(myStr);
  return val;
}