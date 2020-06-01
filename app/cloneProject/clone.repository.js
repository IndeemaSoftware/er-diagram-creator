const git = require("simple-git");
const {
  deleteFolderRecursiveOrFile
} = require(`${projectPath}/app/helpers.js`);
const { USER_FOLDER } = require(`${projectPath}/app/app.config.js`);
/**
 * FUnction to clone project from gitlab or github
 * @param {String} url
 * @param {String} userName
 * @param {String} pass
 * @param {String} userId
 * @returns { String} path to cloned folder
 */
const cloneRepository = async (url, userName, pass, userId) => {
  let clonePath;
  let pathToTempFolder = `${USER_FOLDER(userId)}/tempFolder`;
  if (!userName && !pass) {
    clonePath = url;
  } else {
    clonePath = `https://${userName}:${pass}@${url.slice(8)}`;
  }
  deleteFolderRecursiveOrFile(pathToTempFolder);
  try {
    await new Promise((resolve, reject) => {
      git()
        .silent(true)
        .clone(clonePath, pathToTempFolder, function(err) {
          if (!err) resolve();
          reject(err);
        });
    });
  } catch (err) {
    throw { code: 400, message: "Incorrect username or password" };
  }
  return pathToTempFolder;
};

module.exports = { cloneRepository };
