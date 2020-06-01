const fs = require("fs");
const extractZip = require("extract-zip-promise");
const {
  deleteFolderRecursiveOrFile
} = require(`${projectPath}/app/helpers.js`);
const { USER_FOLDER } = require(`${projectPath}/app/app.config.js`);
/**
 * This method upload and extract user project
 * @param { Object } zipFile - uploaded zip file returned by multer
 * @param {String} userId
 * @returns {String} path to created folder
 */
const uploadZip = async (zipFile, userId) => {
  //Save zip file
  fs.writeFileSync(`${USER_FOLDER(userId)}/temp.zip`, zipFile.buffer);
  //Extract zip file to trmpPass directory
  await extractZip(`${USER_FOLDER(userId)}/temp.zip`, {
    dir: `${USER_FOLDER(userId)}/tempFolder`
  });
  //Delete zip file
  deleteFolderRecursiveOrFile(`${USER_FOLDER(userId)}/temp.zip`);
  return `${USER_FOLDER(userId)}/tempFolder`;
};
module.exports = { uploadZip };
