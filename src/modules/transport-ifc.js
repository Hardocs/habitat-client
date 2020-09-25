// here all database interactions are abstracted, thus decoupled

import PouchDb from 'pouchdb-browser';
import PouchDbFind from 'pouchdb-find';
import PouchDbUpsert from 'pouchdb-upsert';
import { v4 as uuidv4 } from 'uuid'

PouchDb.plugin(PouchDbFind)
PouchDb.plugin(PouchDbUpsert)

const createOrOpenDb = (dbName) => {
  return new PouchDb(dbName, {
    // revs_limit: 1 // *todo* easy way; much of interest to actually decide here, affects all
  })
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
  // from now on, we'll use our own ids, sensible to data,
  // *todo* but for now, this is left for original demo
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

  // *todo* leaving this approach for the moment, in case it has  other interests
  // return new Promise ((resolve, reject) => {
  //   options = { live: false, retry: true}
  //   const rep = PouchDb.replicate(fromDb, toDb, options)
  //     .on ('active', (info) => { resolve(info)})
  //     .on ('change', (info) => { resolve(info)})
  //     .on ('paused', (info) => {
  //       // rep.cancel()
  //       console.log('rep paused: ' + JSON.stringify(info))
  //       resolve('paused'/*JSON.stringify(info)*/)
  //     })
  //     .on ('complete', (info) => {
  //       // rep.cancel()
  //       console.log('rep completed: ' + JSON.stringify(info))
  //       resolve(info)
  //     })
  //     .on ('error', (err) => {
  //       console.log('rep error: ' + err)
  //       if (!err.message.includes ('Failed to fetch')) {
  //         reject(err)
  //       }
  //     })
  //     .on ('denied', (err) => {
  //       console.log('rep denied: ' + err)
  //       // if (!err.message.includes ('Failed to fetch')) {
  //         reject(err)
  //       // }
  //     })
  // })
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
  destroyDb
}

