const fs = require("fs");
/**
 * Function which recursivly create folders by specified path
 * @param {String} path 
 */
const createNestedFolders = path => {
  if (!fs.existsSync(path)) {
    return fs.mkdirSync(path, { recursive: true });
  }
  return 1;
};
/**
 * Function which create file by specified path
 * @param {String} path 
 */
const createfile = path => {
  if (!fs.existsSync(path)) {
    return fs.openSync(path, "w");
  }
};
module.exports = {
  /**Fnction to get user folder (place where all user diagrams are saved
   * @param {String } userId
   * @returns {String} path to folder
   */
  USER_FOLDER: userId => {
    const path = `${projectPath}/Projects/${userId}`;
    createNestedFolders(path);
    return path;
  },
  /**Fnction to get user folder with saved coordiantes for diagram
   * @param {String } userId
   * @param {String } projectName
   * @returns {String} path to file
   */
  COORDS_FOR_RESULT_DIAGRAM: (userId, projectName) => {
    const path = `${projectPath}/Projects/${userId}/${projectName}/savedDiagram`;
    createNestedFolders(path);
    return `${path}/coordinates.js`;
  },

  /**Fnction to get user folder with saved tables for diagram
   * @param {String } userId
   * @param {String } projectName
   * @returns {String} path to file
   */
  TABLES_FOR_RESULT_DIAGRAM: (userId, projectName) => {
    const path = `${projectPath}/Projects/${userId}/${projectName}/savedDiagram`;
    createNestedFolders(path);
    return `${path}/tables.js`;
  },
  /**Fnction to get user folder with temp coordiantes of diagram
   * @param {String } userId
   * @param {String } projectName
   * @returns {String} path to file
   */
  TEMP_COORDS: (userId, projectName) => {
    const path = `${projectPath}/Projects/${userId}/${projectName}/editableDiagram`;
    createNestedFolders(path);
    return `${path}/coordinates.json`;
  },
  /**Fnction to get user folder with temp tables of diagram
   * @param {String } userId
   * @param {String } projectName
   * @returns {String} path to file
   */
  TEMP_TABLES: (userId, projectName) => {
    const path = `${projectPath}/Projects/${userId}/${projectName}/editableDiagram`;
    createNestedFolders(path);
    return `${path}/tables.json`;
  },
  /**Fnction to get user folder with diagram
   * @param {String } userId
   * @returns {String} path to folder
   */
  USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER: userId => {
    const path = `${projectPath}/Projects/${userId}/Zip`;
    createNestedFolders(path);
    return path;
  },
  /**Fnction to get user zip file with diagram
   * @param {String } userId
   * @returns {String} path to file
   */
  USER_PROJECTS_PATH_ZIP_FILE: userId => {
    let path = `${projectPath}/Projects/${userId}`;
    createNestedFolders(path);
    path += `/ZipFile.zip`;
    createfile(path);
    return path;
  },
  /**
   * Every project have html and script file which visualize diagram
   */
  SCRIPT_TO_DRAW_DIAGRAM: `${projectPath}/diagramVisualizer/script.js`,
  HTML_TO_DRAW_DIAGRAM: `${projectPath}/diagramVisualizer/index.html`
};
