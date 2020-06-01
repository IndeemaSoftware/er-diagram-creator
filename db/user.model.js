const mongoose = require(`${projectPath}/db/db.connect.js`);
const Scheme = mongoose.Schema;

const userScheme = new Scheme({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  projects: [
    {
      name: { type: String },
      pathToResultCoords: { type: String },
      pathToTempCoords: { type: String },
      pathToResultTables: { type: String },
      pathToTempTables: { type: String }
    }
  ]
});

const User = mongoose.model("ER-Users", userScheme);
module.exports = User;
