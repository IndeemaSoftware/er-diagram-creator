const express = require("express");
const user = express.Router();
const cookieParser = require("cookie-parser");
const { AUTH } = require(`${projectPath}/app/controller/middlewares.js`);
const UserRepository = require(`${projectPath}/app/user/user.repository.js`);
user.use("/profile", express.static(`${projectPath}/app/user/web`));
user.use(cookieParser());

user.get("/profile", AUTH, async function(req, res, next) {
  res.sendFile(`${projectPath}/app/user/web/profile.html`);
});
user.get("/data", AUTH, function(req, res, next) {
  res.json({ code: 200, data: req.user });
});
user.delete("/project/:projectName", AUTH, async function(req, res, next) {
  try {
    await UserRepository.deleteProject(req.user, req.params.projectName);
    res.json({ code: 200, message: "successfully deleted" });
  } catch (err) {
    next(err);
  }
});
user.put("/project/:projectName", AUTH, async function(req, res, next) {
  try {
    console.log(req.body);
    await UserRepository.updateProjectName(
      req.user,
      req.params.projectName,
      req.body.newName
    );
    res.json({ code: 200, message: "successfully updated" });
  } catch (err) {
    next(err);
  }
});
module.exports = user;
