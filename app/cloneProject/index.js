const express = require("express");
const cloneProject = express.Router();
const DBRepository = require(`${projectPath}/app/diagram/diagram.repository.js`);
const { AUTH } = require(`${projectPath}/app/controller/middlewares.js`);
const {
  cloneRepository
} = require(`${projectPath}/app/cloneProject/clone.repository.js`);
cloneProject.use("/", express.static(`${projectPath}/app/cloneProject/web`));
cloneProject.get("/", AUTH, function(req, res) {
  res.sendFile(`${projectPath}/app/cloneProject/web/index.html`);
});
cloneProject.post("/uploadRemoteRepository", AUTH, async function(
  req,
  res,
  next
) {
  try {
    let pathToExtractedFolder = await cloneRepository(
      req.body.url,
      req.body.userName,
      req.body.pass,
      req.user._id.toString()
    );
    let result = DBRepository.createFileSystem(pathToExtractedFolder);
    console.log(result);
    res.json({ code: 200, message: "Successfully uploaded", data: result });
  } catch (err) {
    next(err);
  }
});
module.exports = cloneProject;
