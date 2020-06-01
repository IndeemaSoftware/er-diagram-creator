const express = require("express");
const remoteDb = express.Router();

const { AUTH } = require(`${projectPath}/app/controller/middlewares.js`);
remoteDb.use("/", express.static(`${projectPath}/app/remote/web`));
remoteDb.get("/", AUTH, function(req, res, next) {
  res.sendFile(`${projectPath}/app/remote/web/index.html`);
});

module.exports = remoteDb;
