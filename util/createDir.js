const fs = require("fs");

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log("[INFO] directory created:", dir);
  }
}

module.exports = createDir;
