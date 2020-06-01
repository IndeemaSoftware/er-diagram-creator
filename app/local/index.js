const express = require("express");
const local = express.Router();
const homedir = require("os").userInfo().homedir;
const multer = require("multer");
const upload = multer();
const { AUTH, isZip } = require(`${projectPath}/app/controller/middlewares.js`);
const DBRepository = require(`${projectPath}/app/diagram/diagram.repository.js`);
const LocalRepository = require(`${projectPath}/app/local/local.repository.js`);
local.use("/", express.static(`${projectPath}/app/local/web`));

local.get("/", AUTH, function(req, res) {
  res.sendFile(`${projectPath}/app/local/web/index.html`);
});

local.get("/homedir", (req, res) => {
  let directories = DBRepository.getHomeDirectories(homedir);
  res.send({ homedir, directories });
});

local.post("/fileSystem", function(req, res) {
  let result = DBRepository.createFileSystem(req.body.path);
  res.send(result);
});
local.post(
  "/uploadZipProject",
  AUTH,
  upload.single("projectZip"),
  isZip,
  async (req, res, next) => {
    try {
      let pathToExtractedFolder = await LocalRepository.uploadZip(
        req.file,
        req.user._id.toString()
      );
      let result = DBRepository.createFileSystem(pathToExtractedFolder);
      console.log(result);
      res.json({ code: 200, message: "Successfully uploaded", data: result });
    } catch (err) {
      next(err);
    }
  }
);
module.exports = local;
