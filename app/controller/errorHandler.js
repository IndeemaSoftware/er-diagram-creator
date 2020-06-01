module.exports = (err, req, res, next) => {
    console.log(err.stack);
    const error = {
        code : err.code || 400,
        message : err.message || "Internal server error"
    }
  res.json(error);
};
