const UserModel = require(`${projectPath}/db/user.model.js`);
const {
  TEMP_COORDS,
  COORDS_FOR_RESULT_DIAGRAM,
  TABLES_FOR_RESULT_DIAGRAM,
  TEMP_TABLES,
  USER_FOLDER
} = require(`${projectPath}/app/app.config.js`);
const {
  deleteFolderRecursiveOrFile
} = require(`${projectPath}/app/helpers.js`);
const fs = require("fs");
/**
 * Function which save created project (er-diagram)
 * @param {String} userId
 * @param {String} projectName
 * @returns {Object} update result
 */
const saveProject = async (userId, projectName) => {
  let result = await UserModel.update(
    { _id: userId },
    {
      $push: {
        projects: {
          name: projectName,
          pathToResultCoords: COORDS_FOR_RESULT_DIAGRAM(userId, projectName),
          pathToTempCoords: TEMP_COORDS(userId, projectName),
          pathToResultTables: TABLES_FOR_RESULT_DIAGRAM(userId, projectName),
          pathToTempTables: TEMP_TABLES(userId, projectName)
        }
      }
    }
  );
  return result;
};
/**
 * Function which delete project
 * @param {Object} userModel
 * @param {String} projectName
 * @returns {Object} updated user model
 */
const deleteProject = async (userModel, projectName) => {
  let userProjects = userModel.projects;
  let elem = userProjects.find(({ name }) => {
    return name.toString() === projectName;
  });
  if (!elem) {
    throw { code: 400, message: "Project doesn't exists" };
  }
  userModel.projects.pull(elem);
  deleteFolderRecursiveOrFile(
    `${USER_FOLDER(userModel._id.toString())}/${projectName}`
  );
  return await userModel.save();
};
const updateProjectName = async (userModel, projectName, newProjectName) => {
  let userProjects = userModel.projects;
  let { __index } = userProjects.find(({ name }) => {
    return name.toString() === projectName;
  });
  let newProjectRaw = userModel.projects[__index].toObject();
  newProjectRaw.name = newProjectName;
  newProjectRaw.pathToResultCoords = newProjectRaw.pathToResultCoords.replace(
    projectName,
    newProjectName
  );
  newProjectRaw.pathToTempCoords = newProjectRaw.pathToTempCoords.replace(
    projectName,
    newProjectName
  );
  newProjectRaw.pathToResultTables = newProjectRaw.pathToResultTables.replace(
    projectName,
    newProjectName
  );
  newProjectRaw.pathToTempTables = newProjectRaw.pathToTempTables.replace(
    projectName,
    newProjectName
  );
  userModel.projects.set(__index, newProjectRaw);
  fs.renameSync(
    `${USER_FOLDER(userModel._id.toString())}/${projectName}`,
    `${USER_FOLDER(userModel._id.toString())}/${newProjectName}`
  );
  return await userModel.save();
};
module.exports = { saveProject, deleteProject, updateProjectName };
