require("./globals");
const express = require("express");
const homedir = require("os").userInfo().homedir;
const app = express();
global.projectPath = __dirname;

const bodyParser = require("body-parser");
const DBRepository = require("./repository/db.repository.js");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", function(req, res) {
  res.sendFile(`${__dirname}/sendFiles/index.html`);
});

app.get("/homedir/", (req, res) => {
  res.send(homedir);
});

app.post("/create/fileSystem/", function(req, res) {
  let result = DBRepository.createFileSystem(req.body.path);
  res.send(result);
});

app.post("/create/diagram/", function(req, res) {
  let result = DBRepository.createDiagram(req.body.paths);
  res.send(result);
});
app.get("/diagram/", (req, res) => {
  res.sendFile(`${__dirname}/Db/table.html`);
});
app.get("/tables/", (req, res) => {
  let tables = DBRepository.getTables();
  res.send(tables);
});

app.post("/save/coordinates/", function(req, res) {
  console.log(req.body);
  DBRepository.saveCoords(req.body.coords);
  res.send("Ok");
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
