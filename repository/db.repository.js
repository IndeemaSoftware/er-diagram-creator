const fs = require("fs");
const dataObjectParser = require("dataobject-parser");
const R = require("ramda");
class dbBuilder {
  static createFileSystem(path) {
    let filesSystem = [];
    try {
      dbBuilder.getFiles(path, filesSystem);
      return filesSystem;
    } catch (e) {
      return e;
    }
  }
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
  static appendDiscriminators(modelsWithDiscriminators, tables) {
    let tableNames = tables.map(table => table.name);
    console.log(tableNames);
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
  static appendMongooseDocument(table, fieldName, filedValue) {
    table.data.push({ fieldName, type: `table[ ${fieldName} ]` });

    /* змінна tableName потрібна для того щоб в назві похідної таблиці було видно хто її батько
      але якщо  батько теж похідний, то батька батька забираємо н-д props [ file [Song ]] - заміняємо на props [ file ]*/

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
  static appendLink(table, fieldName, fieldValue) {
    table.children.push({
      name: fieldValue,
      connection: ["DoubleLine", "DoubleLine"]
    });
    table.data.push({ fieldName: fieldName, type: `table[ ${fieldValue} ]` });
  }

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
            /* Виконується тодi коли у вкладеному об'єкті є ще вкладений об'єкт*/
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
  static cutTableName(table) {
    return table.name.indexOf("[") === -1
      ? table.name
      : table.name.slice(0, table.name.indexOf("["));
  }
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
      fs.unlinkSync(`${projectPath}/result/coordinates.js`);
    } catch (e) {}

    fs.writeFile(
      `${projectPath}/Db/tables.json`,
      JSON.stringify(dbBuilder.tables),
      e => e
    );
    fs.writeFile(
      `${projectPath}/result/tables.js`,
      `let tables = ${JSON.stringify(dbBuilder.tables)}`,
      e => e
    );
    return {
      code: 200,
      message: "ER-diagram is created successfully"
    };
  }
  static getTables() {
    return JSON.parse(fs.readFileSync(`${projectPath}/Db/tables.json`));
  }
  static saveCoords(coordinates) {
    fs.writeFile(
      `${projectPath}/result/coordinates.js`,
      `let coordinates = ${JSON.stringify(coordinates)}`,
      e => e
    );
    fs.writeFile(
      `${projectPath}/Db/coordinates.json`,
      JSON.stringify(coordinates),
      e => e
    );
    return;
  }
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
}

dbBuilder.futureLinks = [];
dbBuilder.tables = [];
module.exports = dbBuilder;
