const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/er-diagram-creator", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
module.exports = mongoose;
