const R = require("ramda");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const UserModel = require(`${projectPath}/db/user.model.js`);
/**
 * function which creates token
 * @param { String } - email
 * @returns { String } - token
 */
const createToken = userEmail => {
  return jwt.sign(
    {
      data: userEmail
    },
    "secret1",
    { expiresIn: "1h" }
  );
};

/**
 * Function which creates user folder ( where his projects will be saved)
 * @param {String } userId
 */
const createProjectsFolder = async userId => {
  fs.mkdirSync(`${projectPath}/Projects/${userId}`, { recursive: true });
};
/**
 * Function which create user in er-diagram-creator app db
 * @param {Object} userData
 * @returns {Object} created user data
 */
const createUser = async userData => {
  let userExists = await UserModel.findOne({ email: userData.email });
  if (userExists) {
    throw { code: 400, message: "Email already in use" };
  }
  let newUser = await UserModel.create(userData);
  createProjectsFolder(newUser._id.toString());
  newUser.token = createToken(newUser.email);
  return newUser;
};
/**
 * Function which check is user registered in app ro not
 * @param {String} email
 * @returns { Object } - object with user data
 */
const signInUser = async email => {
  let user = await UserModel.findOne({ email });
  if (!user) {
    throw { code: 400, message: "User with this email doesn't exists" };
  }
  user.token = createToken(user.email);
  return user;
};
module.exports = { createUser, signInUser };
