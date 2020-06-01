require("./globals");
global.projectPath = __dirname;
global.projectPath = __dirname.slice(0, -4);
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const errorHandler = require(`${projectPath}/app/controller/errorHandler.js`);
const generateFromRemoteDb = require(`${projectPath}/app/remote/index.js`);
const diagram = require(`${projectPath}/app/diagram/index`);
const generateFromLocalProject = require(`${projectPath}/app/local/index.js`);
const auth = require(`${projectPath}/app/auth/auth.js`);
const user = require(`${projectPath}/app/user/user.js`);
const generateFromRemoteRepository = require("./cloneProject/index.js");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(`${projectPath}/app/auth`));
app.use("/auth", auth);
app.use("/local", generateFromLocalProject);
app.use("/remote-connection", generateFromRemoteDb);
app.use("/remote-repository", generateFromRemoteRepository);
app.use("/diagram", diagram);
app.use("/user", user);

app.get("/", function(req, res, next) {
  res.sendFile(`${projectPath}/app/auth/web/index.html`);
});

app.listen(8081, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server start on 8081");
  }
});
app.use(errorHandler);
module.exports = app;
