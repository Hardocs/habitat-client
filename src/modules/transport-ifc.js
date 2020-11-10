// here all database interactions are abstracted, thus decoupled

import PouchDb from 'pouchdb';
import PouchDbFind from 'pouchdb-find';
import PouchDbUpsert from 'pouchdb-upsert';
import { v4 as uuidv4 } from 'uuid'

PouchDb.plugin(PouchDbFind)
PouchDb.plugin(PouchDbUpsert)

const createOrOpenDb = (dbName, opts = {}) => {
  // opts = Object.assign(opts, {
  //   // revs_limit: 1 // *todo* easy way; much of interest to actually decide here, affects all
  // })
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

const putJsonToDb = (db, data) => {
  // *todo* from now on, we'll use our own ids, sensible to data,
  // *todo* but for now, this is left for original demo, out soon
  if (!data._id) {
    data._id = uuidv4()
  }
  return db.put(data)
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

const compactDb = (db) => {
  return db.compact()
}

const destroyDb = (db) => {
  return db.destroy()
}

// eslint-disable-next-line
const upsertJsonToDb = (db, query, data) => {

  return new Promise((resolve, reject) => {
    reject ( 'Upsert not available, will be provided later...instead, use Put')
  })

  // the original code here wasn't a good idea - web people publish such...
  // concept was wrong, but especially, precluded wider area concepts we need
  // when code is provided, we'll also properly remove the lint disable preceding
}

const safeEnv = (value, preset) => { // don't use words like default...

  return typeof value !== 'undefined' && value
    ? value
    : preset
}

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
  compactDb,
  destroyDb,
  safeEnv
}

