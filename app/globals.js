
__dirname = "/home/yuriy/Projects/udb-v2-api";
global.app_require = function(name) {
  return require(__dirname + "/app/" + name);
};

global.core_require = function(name) {
  return require(__dirname + "/core/" + name);
};

global.config_require = function(name) {
  return require(__dirname + "/config/" + name);
};

global.seed_require = function(name) {
  return require(__dirname + "/core/mongo/seeds/" + name);
};

