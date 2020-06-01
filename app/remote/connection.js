const { MongoClient } = require("mongodb");
const NodeSSH = require("node-ssh");
const find = require("find-process");

const ssh = new NodeSSH();

const { SSHConnection } = require("node-ssh-forward");
/**
 * FUnction which create conection with remote db and forward that port to local 9999
 * @param {Object} all needed data
 * @returns {Object, Object} db and connection object
 */
const connectToRemoteServerAndForward = async ({
  remoteHost,
  remoteUserName,
  sshKey,
  mongoDbPort
}) => {
  //Test connection for avoid errors with node-ssh-forward
  await ssh.connect({
    host: remoteHost,
    username: remoteUserName,
    privateKey: sshKey.toString()
  });
  //Kill process on 9999 port to avoid errors
  let list = await find("port", 9999);
  list.forEach(({ pid }) => {
    process.kill(pid);
  });
  const sshConnection = new SSHConnection({
    username: remoteUserName,
    privateKey: sshKey,
    endHost: remoteHost
  });

  await sshConnection.forward({
    fromPort: 9999,
    toPort: mongoDbPort,
    toHost: "127.0.0.1"
  });
  return sshConnection;
};
/**
 * Function which connect to remote db without ssh key
 * @param {Object}
 * @returns db and db client object
 */
const getDataBase = async ({
  dbName,
  dbUserName,
  dbPassword,
  port,
  host = "localhost"
}) => {
  let mongoUrl =
    dbUserName && dbPassword
      ? `mongodb://${dbUserName}:${dbPassword}@${host}:${port}`
      : `mongodb://${host}:${port}`;
  let client = await new MongoClient(mongoUrl);
  await client.connect();
  let db = await client.db(dbName);
  return { db, client };
};
/**
 * Function which connect to db by ssh
 * @param {Object}
 * @returns sshconncetion object, db object db client object
 */
const getDataBaseBySSH = async ({
  remoteHost,
  remoteUserName,
  sshKey,
  remoteDbPort,
  dbName,
  dbUserName,
  dbPassword
}) => {
  const sshConnection = await connectToRemoteServerAndForward({
    remoteHost,
    remoteUserName,
    sshKey,
    mongoDbPort: remoteDbPort
  });
  const { db, client } = await getDataBase({
    dbName,
    dbUserName,
    dbPassword,
    port: 9999
  });
  return { db, sshConnection, client };
};

/* extractDbData = {
  remoteDbPort: 27017,
  remoteHost: "3.21.231.41",
  remoteUserName: "ec2-user",
  sshKey: key,
  dbName: "firstDb",
  dbUserName: "yura1997",
  dbPassword: "yurchuk199718"
}; */
/**
 * Function which extract data from remore db
 * @param {Object} connectionData
 * @returns data base object
 */
const extractDbData = async connectionData => {
  const remoteHost = connectionData.remoteServer;
  const remoteDbPort = connectionData.remotePort;
  const remoteUserName = connectionData.sshUser;
  const dbName = connectionData.dbName;
  const sshKey = connectionData.file;
  const dbUserName = connectionData.dbUserName;
  const dbPassword = connectionData.dbUserPass;
  let result = {};
  if (sshKey) {
    result = await getDataBaseBySSH({
      remoteHost,
      remoteDbPort,
      remoteUserName,
      dbName,
      sshKey: sshKey.buffer,
      dbUserName,
      dbPassword
    });
  } else {
    result = await getDataBase({
      dbName,
      dbUserName,
      dbPassword,
      port: remoteDbPort,
      host: remoteHost
    });
  }
  return result;
};

/* getRemoteDb({
  remoteDbPort: 27017,
  remoteHost: "3.21.231.41",
  remoteUserName: "ec2-user",
  sshKey: key,
  dbName: "firstDb",
  dbUserName: "yura1997",
  dbPassword: "yurchuk199718"
}); */

module.exports = {
  getDataBaseBySSH,
  getDataBase,
  connectToRemoteServerAndForward,
  extractDbData
};
