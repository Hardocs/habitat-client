// here all database interactions are abstracted, thus decoupled
// *todo* NOTE THAT ALL THESE WILL BE GONE SHORtLY -- SEE NOTE in habitat-database

import PouchDb from 'pouchdb';
import upsert from './pouchdb-our-upsert'

PouchDb.plugin(upsert);

const createOrOpenDb = (dbName, opts = {}) => {
  return new PouchDb(dbName/*, opts*/)
}

const getStatusFromDb = (db) => {
  return db.info() // a promise, be aware, as all db.call()s are in Couch family
}

const createIndexOnDb = (db, index) => {
  return db.createIndex(index)
}

const explainJsonFromDb = (db, query) => {
  return db.explain(query)
}

const getJsonFromDb = (db, query, options = {}) => {
  return db.get(query, options)
}

const alldocsJsonFromDb = (db, options = {}) => {
  return db.allDocs(options)
}

const findJsonFromDb = (db, query) => {
  return db.find(query)
}

const putJsonToDb = (db, data, options = {}) => {
  return db.put(data, options)
}

const removeJsonFromDb = (db, record) => {
  return db.remove(record)
}

const replicateDb = (fromDb, toDb, options) => {
  return new Promise ((resolve, reject) => {
    PouchDb.replicate(fromDb, toDb, options)
      .then (result => {
        resolve (result)
      })
      .catch (err => {
          reject(err)
      })
    })
}

const deleteDocument = (db, doc) => {
  return db.remove (doc._id, doc._rev)
}

const compactDb = (db) => {
  return db.compact()
}

const destroyDb = (db) => {
  return db.destroy()
}

const upsertJsonToDb = (db, id, diffFunc) => {
  return db.upsert(id, diffFunc)
}

// const safeEnv = (value, preset) => { // don't use words like default...
//
//   return typeof value !== 'undefined' && value
//     ? value
//     : preset
// }

export {
  createOrOpenDb,
  getStatusFromDb,
  createIndexOnDb,
  upsertJsonToDb,
  explainJsonFromDb,
  getJsonFromDb,
  alldocsJsonFromDb,
  findJsonFromDb,
  putJsonToDb,
  removeJsonFromDb,
  replicateDb,
  deleteDocument,
  compactDb,
  destroyDb,
  // safeEnv
}

