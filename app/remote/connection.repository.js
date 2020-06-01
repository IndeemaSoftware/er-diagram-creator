const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const getCollectionsNames = async db => {
  let collectionsList = await db.listCollections().toArray();
  let collectionNames = collectionsList.map(elem => elem.name);
  return collectionNames;
};
/**
 * Function which get first document from collection
 * @param {Object} db
 * @param {String} collectionName
 */
const getCollectionDocument = async (db, collectionName) => {
  let document = await db.collection(collectionName).findOne();
  return document;
};
/**
 * Function which creates model from specified schema
 * @param {String} collectionName
 * @param {Object} schema
 * @returns {Object} created model
 */
const createModel = (collectionName, schema) =>
  mongoose.model(collectionName, schema);

/**
 * FUnction which generate Schema object from simple object
 * @param {Object} object
 * @param {Object} resObject - result object
 */
function generateSchema(object, resObject = {}) {
  for (let key in object) {
    resObject[key] = getType(object[key], typeof object[key]);
  }
  return new Schema(resObject);
}
/**
 * Function which returns Shema type due to type
 * @param {Any} value
 * @param {String} type
 */
function getType(value, type) {
  switch (type) {
    case "boolean":
      return Schema.Types.Boolean;
    case "string":
      return Schema.Types.String;
    case "number":
      return Schema.Types.Number;
    case "object":
      if (Array.isArray(value)) return getType(value, "array");
      if (isDate(value)) return Schema.Types.Date;
      if (value._bsontype === "ObjectID") return Schema.Types.ObjectId;
      return generateSchema(value);
    case "array":
      if (value.length) return [getType(value[0], typeof value[0])];
      else return Schema.Types.Array;
  }
}

/**
 * Function which check is value date
 * @param {Object} date
 * @returns {Boolean}
 */
function isDate(date) {
  Date.prototype.isDate = function() {
    return this !== "Invalid Date" && !isNaN(this) ? true : false;
  };
  return new Date(date).isDate();
}
module.exports = {
  getCollectionsNames,
  getCollectionDocument,
  createModel,
  generateSchema
};
