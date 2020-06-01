const express = require("express");
const {
  AUTH,
  createProject
} = require(`${projectPath}/app/controller/middlewares.js`);
const diagram = express.Router();
const multer = require("multer");
const upload = multer();
const DBRepository = require(`${projectPath}/app/diagram/diagram.repository.js`);
const remote = require(`${projectPath}/app/remote/connection.js`);
diagram.use("/", express.static(`${projectPath}/app/editableDiagram/`));

diagram.post("/create/localDb", AUTH, createProject, async function(
  req,
  res,
  next
) {
  try {
    await DBRepository.createDiagramFromModels(
      req.body.paths,
      req.user._id.toString(),
      req.body.projectName
    );
    res.json({ code: 200, message: "Successfully created" });
  } catch (err) {
    next(err);
  }
});
diagram.post(
  "/create/remoteDb",
  AUTH,
  upload.single("sshKey"),
  createProject,
  async function(req, res, next) {
    let db, sshConnection, client;
    try {
      let result = await remote.extractDbData({ ...req.body, file: req.file });
      db = result.db;
      sshConnection = result.sshConnection;
      client = result.client;
      await DBRepository.createDiagramFromRemoteDb(
        db,
        req.user._id.toString(),
        req.body.projectName
      );
      client.close();
      if (sshConnection) sshConnection.shutdown();
      res.json({ code: 200, message: "Successfully created" });
    } catch (err) {
      if (client) client.close();
      if (sshConnection) sshConnection.shutdown();
      next(err);
    }
  }
);

diagram.get("/project/:projectName", AUTH, (req, res) => {
  let tables = DBRepository.getTables(
    req.user._id.toString(),
    req.params.projectName
  );
  let coordinates = DBRepository.getCoordinates(
    req.user._id.toString(),
    req.params.projectName
  );
  res.json({
    code: 200,
    message: "Succesfully get coords and tables",
    data: { coordinates, tables, projectName: req.params.projectName }
  });
});

diagram.post("/save/:projectName", AUTH, function(req, res) {
  DBRepository.saveCoords(
    req.body.coords,
    req.user._id.toString(),
    req.params.projectName === "none"
      ? req.user.projects[req.user.projects.length - 1].name
      : req.params.projectName
  );
});

diagram.get("/download/:projectName", AUTH, async (req, res, next) => {
  let path = await DBRepository.createZip(
    req.user._id.toString(),
    req.params.projectName
  );
  res.set("Content-Type", "application/zip");

  res.sendFile(path);
});
diagram.post("/sendByEmail/:projectName", AUTH, async (req, res, next) => {
  try {
    await DBRepository.sendEmail(
      req.user._id.toString(),
      req.params.projectName,
      req.body.email,
      req.user.email.toString()
    );
    res.json({ code: 200, message: "Successfully sent" });
  } catch (err) {
    next(err);
  }
});
module.exports = diagram;
