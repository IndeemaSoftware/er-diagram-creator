const fs = require("fs");
const dataObjectParser = require("dataobject-parser");
const R = require("ramda");
const path = require("path");

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
      dbBuilder.getFiles(path, filesSystem);
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
            path: `${path}${elem.name}`,
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
   * create diagram
   *
   * @param {array} files - path to model files
   *
   */

  static createDiagram(files) {
    dbBuilder.tables = [];
    for (let i = 0; i < files.length; i++) {
      let model;
      try {
        model = require(files[i]);
        dbBuilder.parseModel(model.schema, model.modelName, true, model);
      } catch (e) {
        return {
          code: 500,
          message: `Error in ${files[i]} file.\n1). Check if it is a model.\n2). If it has custom globals functions or variables - move them to globals.js`
        };
      }
    }
    dbBuilder.appendDiscriminators(dbBuilder.futureLinks, dbBuilder.tables);
    try {
      fs.unlinkSync(`${projectPath}/Db/coordinates.json`);
      fs.unlinkSync(`${projectPath}/savedDiagram/coordinates.js`);
    } catch (e) {}

    fs.writeFile(
      `${projectPath}/Db/tables.json`,
      JSON.stringify(dbBuilder.tables),
      e => e
    );
    fs.writeFile(
      path.join(projectPath, "../savedDiagram/tables.js"),
      `let tables = ${JSON.stringify(dbBuilder.tables)}`,
      e => e
    );
    return {
      code: 200,
      message: "ER-diagram is created successfully"
    };
  }

  /**
   * get json object with tables data
   * @returns {array} array of tables
   */

  static getTables() {
    return JSON.parse(fs.readFileSync(`${projectPath}/Db/tables.json`));
  }
  /**
   * save coordinates of each table
   * @param {array} coordinates - array of coordinates every table
   */
  static saveCoords(coordinates) {
    fs.writeFile(
      path.join(projectPath, "../savedDiagram/coordinates.js"),
      `let coordinates = ${JSON.stringify(coordinates)}`,
      e => e
    );
    fs.writeFile(
      `${projectPath}/Db/coordinates.json`,
      JSON.stringify(coordinates),
      e => e
    );
    return "Diagram is saved";
  }

  /**
   * get coordinates of each table
   * @return {array} coordinates - array of coordinates every table
   */

  static getCoordinates() {
    let coordinates;
    try {
      coordinates = JSON.parse(
        fs.readFileSync(`${projectPath}/Db/coordinates.json`)
      );
    } catch (e) {
      return null;
    }
    return coordinates;
  }
  /**
   * get coordinates from /savedDiagram and set them to /Db
   */
  static editDiagram() {
    let tables = fs
      .readFileSync(path.join(projectPath, "../savedDiagram/tables.js"))
      .slice(13);
    let coords = fs
      .readFileSync(path.join(projectPath, "../savedDiagram/coordinates.js"))
      .slice(18);

    fs.writeFile(`${projectPath}/Db/coordinates.json`, coords, e => e);
    fs.writeFile(`${projectPath}/Db/tables.json`, tables, e => e);
    return {
      code: 200,
      message: ""
    };
  }
}
dbBuilder.futureLinks = [];
dbBuilder.tables = [];
module.exports = dbBuilder;
