const jwt = require("jsonwebtoken");
const UserModel = require(`${projectPath}/db/user.model.js`);
/**
 * Function which check by token sent  with cookie is user in app or not
 * @param {Object} req
 * @param {Object} res
 * @param {FUnction} next
 */
const AUTH = async (req, res, next) => {
  try {
    let { data: email } = req.cookies
      ? jwt.verify(req.cookies.token, "secret1")
      : jwt.verify(getCookie(req.headers.cookie, "token"), "secret1");
    let user = await UserModel.findOne(
      { email },
      "email firstName lastName _id projects"
    );
    if (!user) {
      next({ code: 400, message: "User is not authorized" });
    } else {
      req.user = user;
      next();
    }
  } catch (err) {
    res.redirect("/");
  }
};
/**
 * Function which check is project name unique
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const createProject = (req, res, next) => {
  if (
    req.user.projects.find(({ name }) => {
      return req.body.projectName === name;
    })
  ) {
    next({ code: 400, message: "Project with this name already exists" });
  } else {
    next();
  }
};
/**
 * Function which check is sent file with zip extention
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */

const isZip = (req, res, next) => {
  if (req.file.originalname.endsWith(".zip")) {
    next();
  } else {
    next({ code: 400, message: "Invalid file type" });
  }
};
/**
 * Function to get coockie by name
 * @param {String} cookies
 * @param {String} name 
 * @returns {String} cookie
 */
const getCookie = (cookie, name) => {
  let matches = cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

module.exports = { AUTH, createProject, isZip };


