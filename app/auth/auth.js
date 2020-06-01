const express = require("express");
const auth = express.Router();
const cookieParser = require("cookie-parser");
const applicationId =
  "6bfc97dffeba886c2db256f16a4c2b5904e8064f11e18958a086c3d19e07e55e";
const secret =
  "c21d0e2b91e65db9593fd3729a9944b18ab6a62d1701381f62fc393deb341bf2";

const indeemaGitLabApplicationId =
  "c46a3f11c82100b99c66d59d9207cda8a592fa160cfd7f061dff8a7de1490a9f";
const indeemaGitLabAppliactionSecret =
  "59313c753a9c98e4e2cf738e4613049a09c3470a9bc27aab523dd0d9c853e74c";
const axios = require("axios");

const authRepository = require(`${projectPath}/app/auth/auth.repository.js`);

auth.use(cookieParser());

auth.post("/signup", async function(req, res, next) {
  try {
    let user = await authRepository.createUser(req.body);
    res.cookie("token", user.token, {
      maxAge: 1000 * 60 * 60,
      domain: "127.0.0.1",
      path: "/"
    });
    res.redirect("/user/profile");
  } catch (err) {
    next(err);
  }
});

/* login by gitlab */
auth.get("/login/gitLab", async function(req, res, next) {
  try {
    let { data } = await axios.post(
      `https://gitlab.com/oauth/token?client_id=${applicationId}&client_secret=${secret}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=http://127.0.0.1:8081/auth/login/gitLab`
    );
    let userData = await axios.get(
      `https://gitlab.com/api/v4/user?access_token=${data.access_token}`
    );
    const user = await authRepository.signInUser(userData.data.email);
    res.cookie("token", user.token, {
      maxAge: 1000 * 60 * 60,
      domain: "127.0.0.1",
      path: "/"
    });
    res.redirect("/user/profile");
  } catch (err) {
    next(err);
  }
});

/*login by indeema gitlab*/

auth.get("/login/indeemaGitLab", async function(req, res, next) {
  try {
    let { data } = await axios({
      method: "POST",
      url: `https://git.indeema.com/oauth/token?client_id=${indeemaGitLabApplicationId}&client_secret=${indeemaGitLabAppliactionSecret}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=http://127.0.0.1:8081/auth/login/indeemaGitLab`
    }).catch(err => {
      console.log(err);
    });
    let userData = await axios.get(
      `https://git.indeema.com/api/v3/user?access_token=${data.access_token}`
    );
    const user = await authRepository.signInUser(userData.data.email);
    res.cookie("token", user.token, {
      maxAge: 1000 * 60 * 60,
      domain: "127.0.0.1",
      path: "/"
    });
    res.redirect("/user/profile");
  } catch (err) {
    next(err);
  }
});
module.exports = auth;
