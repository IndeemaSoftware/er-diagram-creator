const fs = require("fs");
/**
 * Function which recursivly delete file or folder
 * @param {Sreing} path
 */
function deleteFolderRecursiveOrFile(path) {
  if (!fs.existsSync(path)) return;
  if (!fs.lstatSync(path).isDirectory()) {
    fs.unlinkSync(path);
  } else if (fs.lstatSync(path).isDirectory()) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file, index) {
        let curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          deleteFolderRecursiveOrFile(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }
}

module.exports = { deleteFolderRecursiveOrFile };
