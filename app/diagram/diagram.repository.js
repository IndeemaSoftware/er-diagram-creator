const fs = require("fs");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const dataObjectParser = require("dataobject-parser");
const R = require("ramda");
const { zip } = require("zip-a-folder");
const {
  deleteFolderRecursiveOrFile
} = require(`${projectPath}/app/helpers.js`);
const {
  TEMP_COORDS,
  COORDS_FOR_RESULT_DIAGRAM,
  TABLES_FOR_RESULT_DIAGRAM,
  TEMP_TABLES,
  SCRIPT_TO_DRAW_DIAGRAM,
  HTML_TO_DRAW_DIAGRAM,
  USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER,
  USER_PROJECTS_PATH_ZIP_FILE,
  USER_FOLDER
} = require(`${projectPath}/app/app.config.js`);
const UserRepository = require(`${projectPath}/app/user/user.repository.js`);
const {
  getCollectionsNames,
  getCollectionDocument,
  generateSchema,
  createModel
} = require(`${projectPath}/app/remote/connection.repository.js`);
/**
 * FUnction which copy file
 * @param {String} from
 * @param {String} to
 */
const copyFile = (from, to) => {
  try {
    fs.writeFileSync(to, fs.readFileSync(from));
  } catch (err) {}
};
class dbBuilder {
  /**
   * get all folders from user directory
   *
   * @param {string} path - path to user home directory
   * @returns {Array} array with pathes to every directory
   */
  static getHomeDirectories(path) {
    return fs
      .readdirSync(path)
      .filter(name => fs.lstatSync(`${path}/${name}`).isDirectory())
      .map(elem => `${path}/${elem}/`);
  }

  /**
   * create custom fileSystem
   *
   * @param {string} path - path to user home directory
   * @returns {Array} array with pathes to every directory and file
   */

  static createFileSystem(path) {
    let filesSystem = [];
    try {
      dbBuilder.getFiles(`${path}/`, filesSystem);
      return filesSystem;
    } catch (e) {
      return e;
    }
  }

  /**
   * get files from directroy
   *
   * @param {string} path - path to user home directory
   * @param {object} fileObject - object with files and folders
   * @returns {Array} array with pathes to every directory and file
   */

  static getFiles(path, fileObject) {
    let filesAndFolders = [];

    filesAndFolders = fs.readdirSync(path, {
      withFileTypes: true
    });

    fileObject.push(
      ...filesAndFolders
        .filter(elem => {
          return (
            elem.name.endsWith(".js") ||
            elem.name.endsWith(".json") ||
            (fs.lstatSync(`${path}/${elem.name}`).isDirectory() &&
              elem.name != "node_modules")
          );
        })
        .map(elem => {
          let obj = {
            title: elem.name,
            path: `${path.slice(path.indexOf("tempFolder"))}${elem.name}`,
            folder: fs.lstatSync(`${path}/${elem.name}`).isDirectory(),
            children: []
          };
          if (obj.folder)
            dbBuilder.getFiles(`${path}${obj.title}/`, obj.children);
          return obj;
        })
    );
  }
  /**
   * take schema object data and build table object
   * table object is appended to tables array
   * @param {object} schema - model schema
   * @param {string} name - models name
   * @param {boolean} isMain - is model required or extracted from parent model
   * @param {object} model - parent model
   */
  static parseModel(schema, name, isMain = false, model = null) {
    let table = { name, children: [], data: [], isMain };
    if (R.path(["discriminators"], model))
      dbBuilder.futureLinks.push({ table, model });
    let mongooseCollection = schema.paths;
    let nestedData = new dataObjectParser();
    for (let fieldName in mongooseCollection) {
      if (fieldName.indexOf(".") !== -1) {
        nestedData.set(fieldName, mongooseCollection[fieldName]);
      } else if (R.path(["options", "ref"], mongooseCollection[fieldName])) {
        dbBuilder.appendLink(
          table,
          fieldName,
          R.path(["options", "ref"], mongooseCollection[fieldName])
        );
      } else if (mongooseCollection[fieldName].schema) {
        dbBuilder.appendMongooseDocument(
          table,
          fieldName,
          mongooseCollection[fieldName]
        );
      } else {
        dbBuilder.appendField(
          table,
          fieldName,
          mongooseCollection[fieldName].instance
        );
      }
    }

    if (!R.isEmpty(nestedData.data()))
      dbBuilder.parseNestedCollection(table, nestedData.data());
    dbBuilder.tables.push(table);
  }
  /**
   * add to every table links created by discriminator
   *
   * @param {array} modelsWithDiscriminators - array with tables which have this links
   * @param {array} tables - all tables
   */
  static appendDiscriminators(modelsWithDiscriminators, tables) {
    let tableNames = tables.map(table => table.name);
    modelsWithDiscriminators.forEach(model => {
      let discriminators = model.model.discriminators;
      for (let field in discriminators) {
        let fieldValue = dbBuilder.theMostSimilar(
          discriminators[field].modelName,
          tableNames
        );
        if (fieldValue) {
          dbBuilder.appendLink(
            model.table,
            discriminators[field].modelName,
            fieldValue
          );
        }
      }
    });
  }
  /**
   * add to  child to main Table, set connection
   *
   * @param {object} table - parent table
   * @param {string} fieldName - name of child
   * @param {object} filedValue - child table data
   */
  static appendMongooseDocument(table, fieldName, filedValue) {
    table.data.push({ fieldName, type: `table[ ${fieldName} ]` });
    let tableName = dbBuilder.cutTableName(table);
    table.children.push({
      name: `${fieldName}[${tableName}]`,
      connection: [
        "DoubleLine",
        filedValue.$isSingleNested ? "DoubleLine" : "LineFork"
      ]
    });
    dbBuilder.parseModel(filedValue.schema, `${fieldName}[${tableName}]`);
  }
  static appendField(table, fieldName, type) {
    table.data.push({ fieldName, type });
  }
  /**
   * set connection between current table and table specified in ref
   *
   * @param {object} table - parent table
   * @param {string} fieldName - name of child
   * @param {object} filedValue - child table data
   */
  static appendLink(table, fieldName, fieldValue) {
    table.children.push({
      name: fieldValue,
      connection: ["DoubleLine", "DoubleLine"]
    });
    table.data.push({ fieldName: fieldName, type: `table[ ${fieldValue} ]` });
  }
  /**
   * find the most similar word in array to specified word
   *
   * @param {object} table - parent table
   * @param {string} str - searching in mas by this variable
   * @param {array} mas - tables name array
   * @returns {string} - the most similar word in array to str
   */
  static theMostSimilar(str, mas) {
    let counts = mas.map(elem => {
      let word = elem.toLowerCase();
      let similarsCount = 0;
      word.split("").forEach((letter, index) => {
        if (letter === str[index]) similarsCount++;
      });
      return similarsCount - Math.abs(word.length - str.length);
    });
    let best,
      max = -1000;
    counts.forEach((elem, index) => {
      if (max < elem) {
        max = elem;
        best = mas[index];
      }
    });
    return Math.abs(max - str.length) > 3 ? null : best;
  }

  /**
   * parse model fields which contain . in name
   *
   * @param {object} parentTable - parent table
   * @param {object} nestedFieldsObject - current nested table
   */

  static parseNestedCollection(parentTable, nestedFieldsObject) {
    let parentTableName = dbBuilder.cutTableName(parentTable);

    for (let keys in nestedFieldsObject) {
      parentTable.children.push({
        name: `${keys}[${parentTableName}]`,
        connection: ["DoubleLine", "DoubleLine"]
      });
      parentTable.data.push({ fieldName: keys, type: `table [ ${keys} ]` });
      let nestedTable = {
        name: `${keys}[${parentTableName}]`,
        data: [],
        children: []
      };
      let veryNested = {};
      for (let key in nestedFieldsObject[keys]) {
        if (nestedFieldsObject[keys][key].schema) {
          dbBuilder.appendMongooseDocument(
            nestedTable,
            key,
            nestedFieldsObject[keys][key]
          );
        } else {
          if (R.path(["options", "ref"], nestedFieldsObject[keys][key])) {
            dbBuilder.appendLink(
              nestedTable,
              key,
              R.path(["options", "ref"], nestedFieldsObject[keys][key])
            );
          } else if (!nestedFieldsObject[keys][key].instance) {
            /* it is executed when in nested object is another nested object */
            veryNested[key] = { ...nestedFieldsObject[keys][key] };
            delete nestedFieldsObject[keys][key];
            dbBuilder.parseNestedCollection(nestedTable, veryNested, keys);
          } else {
            dbBuilder.appendField(
              nestedTable,
              key,
              nestedFieldsObject[keys][key].instance
            );
          }
        }
      }
      dbBuilder.tables.push(nestedTable);
    }
  }

  /**
   * extract from string which has '[' word before '['
   *
   * @param {object} table - current table
   * @returns {object} table with changed name
   */
  static cutTableName(table) {
    return table.name.indexOf("[") === -1
      ? table.name
      : table.name.slice(0, table.name.indexOf("["));
  }
  /**
   * save JSON object with information about tables
   * @param {string} path - destionation of file
   * @returns {object} result of saving
   */
  static saveTablesData(path, extention) {
    let data;
    if (extention === ".js") {
      data = `let tables = ${JSON.stringify(dbBuilder.tables)}`;
    } else {
      data = JSON.stringify(dbBuilder.tables);
    }
    return fs.writeFile(path, data, e => e);
  }
  /**
   * Function which extract models and transfer
   * @param {Array} files - array with pathes to model files
   */

  static createDiagramFromModels(files, userId, projectName) {
    let models = files.map(file =>
      dbBuilder.getModel(`${USER_FOLDER(userId)}/${file}`)
    );
    return dbBuilder.createDiagram(models, userId, projectName);
  }
  /**
   * FUnction to create diagram from remote db
   * @param {bject} db
   * @param {String} userId
   * @param {String} projectName
   * @returns {Function} function which create diagram
   */
  static async createDiagramFromRemoteDb(db, userId, projectName) {
    let collectionNames = await getCollectionsNames(db);
    if (!collectionNames || !collectionNames.length)
      throw { code: 400, message: "Incorrect Db name" };
    const documents = await Promise.all(
      collectionNames.map(collectionName => {
        return getCollectionDocument(db, collectionName);
      })
    );
    const schemas = documents.map(document => {
      return generateSchema(document);
    });
    const models = schemas.map((schema, index) => {
      return createModel(collectionNames[index], schema);
    });
    return await dbBuilder.createDiagram(models, userId, projectName);
  }

  /**
   * create diagram
   *
   * @param {array} files - path to model files
   *
   */

  static async createDiagram(models, userId, projectName) {
    dbBuilder.tables = [];
    models.forEach(model =>
      dbBuilder.parseModel(model.schema, model.modelName, true, model)
    );
    dbBuilder.appendDiscriminators(dbBuilder.futureLinks, dbBuilder.tables);
    dbBuilder.cleanCoordinates([
      TEMP_COORDS(userId, projectName),
      COORDS_FOR_RESULT_DIAGRAM(userId, projectName)
    ]);
    dbBuilder.saveTablesData(TEMP_TABLES(userId, projectName));
    dbBuilder.saveTablesData(
      TABLES_FOR_RESULT_DIAGRAM(userId, projectName),
      ".js"
    );
    await UserRepository.saveProject(userId, projectName);
    models.forEach(dbBuilder.deleteUsedModel);
    return {
      code: 200,
      message: "ER-diagram is created successfully"
    };
  }

  /**
   * get json object with tables data
   * @returns {array} array of tables
   */

  static getTables(userId, projectName) {
    return JSON.parse(fs.readFileSync(TEMP_TABLES(userId, projectName)));
  }
  /**
   * save coordinates of each table
   * @param {array} coordinates - array of coordinates every table
   */
  static saveCoords(coordinates, userId, projectName) {
    fs.writeFile(
      COORDS_FOR_RESULT_DIAGRAM(userId, projectName),
      `let coordinates = ${JSON.stringify(coordinates)}`,
      e => e
    );
    fs.writeFile(
      TEMP_COORDS(userId, projectName),
      JSON.stringify(coordinates),
      e => e
    );
    return "Diagram is saved";
  }

  /**
   * get coordinates of each table
   * @return {array} coordinates - array of coordinates every table
   */

  static getCoordinates(userId, projectName) {
    let coordinates;
    try {
      coordinates = JSON.parse(
        fs.readFileSync(TEMP_COORDS(userId, projectName))
      );
    } catch (e) {
      return null;
    }
    return coordinates;
  }

  /**
   * delete old coordinates for writing new ( in future)
   * @param {[String]} paths - paths to files with saved coordinates
   * @returns {array} - deleted files
   */
  static cleanCoordinates(paths) {
    return paths.map(path => fs.unlink(path, err => err));
  }
  /**
   * get model object by specified path
   * @param {String} path - path to model
   * @returns {array} - model object
   */
  static getModel(pathToModel) {
    try {
      return require(pathToModel);
    } catch (err) {
      throw {
        code: 500,
        message: `Error in ${pathToModel} file.\n1). Check if it is a model.\n2). If it has custom globals functions or variables - move them to globals.js`
      };
    }
  }
  /**
   * Function which delete already used models to avoid OverwriteModelError
   * @param {Object} model - mongoose model
   */
  static deleteUsedModel({ modelName }) {
    delete mongoose.connection.models[modelName];
  }
  /**
   * Function which create zip file from sevaed diagram folder
   * @param {String} userId
   * @param {String} projectName
   * @returns {String} path to created file
   */
  static async createZip(userId, projectName) {
    deleteFolderRecursiveOrFile(
      USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(userId, projectName)
    );
    deleteFolderRecursiveOrFile(
      USER_PROJECTS_PATH_ZIP_FILE(userId, projectName)
    );
    copyFile(
      COORDS_FOR_RESULT_DIAGRAM(userId, projectName),
      `${USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(
        userId,
        projectName
      )}/coordinates.js`
    );
    copyFile(
      TABLES_FOR_RESULT_DIAGRAM(userId, projectName),
      `${USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(userId, projectName)}/tables.js`
    );
    copyFile(
      SCRIPT_TO_DRAW_DIAGRAM,
      `${USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(userId, projectName)}/script.js`
    );
    copyFile(
      HTML_TO_DRAW_DIAGRAM,
      `${USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(userId, projectName)}/index.html`
    );
    await zip(
      USER_PROJECTS_PATH_TO_DOWNLOAD_FOLDER(userId, projectName),
      USER_PROJECTS_PATH_ZIP_FILE(userId, projectName)
    );
    return USER_PROJECTS_PATH_ZIP_FILE(userId, projectName);
  }
  /**
   * FUnction which send diagram files by specified email
   * @param {String} userId
   * @param {String} projectName
   * @param {String} mailTo
   * @param {String} mailFrom
   */
  static async sendEmail(userId, projectName, mailTo, mailFrom) {
    const userEmail = "yuriy.ivanyk@indeema.com";
    const coordinatesFile = COORDS_FOR_RESULT_DIAGRAM(userId, projectName);
    const userPassword = "gkhoroopcptomgur";
    let attachments = [
      {
        filename: "index.html",
        content: fs.createReadStream(HTML_TO_DRAW_DIAGRAM)
      },
      {
        filename: "script.js.txt",
        content: fs.createReadStream(HTML_TO_DRAW_DIAGRAM)
      },
      {
        filename: "tables.js.txt",
        content: fs.createReadStream(
          TABLES_FOR_RESULT_DIAGRAM(userId, projectName)
        )
      }
    ];
    if (fs.existsSync(coordinatesFile)) {
      attachments.push({
        filename: "coordinates.js.txt",
        content: fs.createReadStream(coordinatesFile)
      });
    }
    nodemailer.createTransport(
      `smtps://${userEmail}:${userPassword}@smtp.gmail.com`
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: userEmail,
        pass: userPassword
      }
    });

    // setup e-mail data with unicode symbols
    const mailOptions = {
      from: mailFrom, // sender address
      to: mailTo, // list of receivers
      subject: `Er-diagram-creator, project - ${projectName}`,
      attachments
    };

    // send mail with defined transport object
    return await new Promise((reslove, reject) => {
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          reject({ code: 400, message: error });
        }
        reslove();
      });
    });
  }
}
dbBuilder.futureLinks = [];
dbBuilder.tables = [];
module.exports = dbBuilder;
