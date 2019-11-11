require("./globals");
const express = require("express");
const homedir = require("os").userInfo().homedir;
const app = express();
global.projectPath = __dirname;
const bodyParser = require("body-parser");
const DBRepository = require("./repository/db.repository.js");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/diagram/", express.static(`${__dirname}/Db`));
app.use("/", express.static(`${__dirname}/frontPage`));

app.get("/", function(req, res) {
  res.sendFile(`${__dirname}/frontPage/index.html`);
});

app.get("/homedir/", (req, res) => {
  let directories = DBRepository.getHomeDirectories(homedir);
  res.send({ homedir, directories });
});

app.post("/create/fileSystem/", function(req, res) {
  let result = DBRepository.createFileSystem(req.body.path);
  res.send(result);
});

app.post("/create/diagram/", function(req, res) {
  let result = DBRepository.createDiagram(req.body.paths);
  res.send(result);
});
app.put("/edit/diagram/", function(req, res) {
  let result = DBRepository.editDiagram();
  res.send(result);
});
app.get("/diagram/", (req, res) => {
  res.sendFile(`${__dirname}/Db/index.html`);
});
app.get("/tables/", (req, res) => {
  let tables = DBRepository.getTables();
  res.send(tables);
});

app.post("/save/coordinates/", function(req, res) {
  DBRepository.saveCoords(req.body.coords);
});
app.get("/coordinates/", function(req, res) {
  let coordinates = DBRepository.getCoordinates();
  res.send(coordinates);
});

app.listen(8081, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server start");
  }
});
module.exports = app;
