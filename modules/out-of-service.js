// n.b.  Normally you would not import this file into any application

// These are early Habitat calls that are probably going out, given our simplified
// access for the main Hardocs application, and some of them were never filled out
// to actually work, either, but let's not lose them in case there might be usefulness

// some items are disabled - not exported. Leave them that way. Some are
// quite dangerous to a real app

import {
  createIndexOnDb, destroyDb, explainJsonFromDb, findJsonFromDb,
  getStatusFromDb, putJsonToDb, removeJsonFromDb, replicateDb
}
  from '@/modules/transport-ifc';
import { createOrOpenDatabase, getStatusOfDatabase} from '@/modules/habitat-database';

const createIndexOnDatabase = (db, index) => {
  return createIndexOnDb(db, index)
}

const explainJsonFromDatabase = (db, query) => {
  return explainJsonFromDb (db, query)
}

const findJsonFromDatabase = (db, query) => {
  return findJsonFromDb (db, query)
}

const upsertJsonToDatabase = (db, query, data) => {
  // n.b. this is disabled above in the present for good cause
  // the later solution may involve differences at
  // this level also, to provide full compatibility
  // with different basis interfaces
  return upsertJsonToDb(db, query, data)
}

const removeJsonFromDatabase = (db, record) => {
  return removeJsonFromDb(db, record)
}

const openPWRemote = (remoteDbName, userName = 'admin-hard', userPass = '4admin-hard') => {

  // *todo* big assumption _only_ for first early moment in dev, is no https, password authentication...
  let remoteDb = createOrOpenDatabase(remoteDbName)
  console.log('remoteDb: ' + JSON.stringify(remoteDb))
  if (!remoteDb) {
    return null // no promise on this call, so old-style handling
  }

  remoteDb.login(userName, userPass)
    .then (result => {
      const msg = 'login: ' + JSON.stringify(result)
      console.log (msg)
    })
    .then (() => {
      return getStatusOfDatabase(remoteDb)
    })
    .then(function (info) {
      console.log('remoteDb info: ' + JSON.stringify(info))
    })
    .catch (err => {
      const msg = remoteDbName + ': ' + JSON.stringify(err)
      console.log (msg)
      remoteDb = null
    })

  return remoteDb
}

const replicateDatabase = (from, to, options = []) => {
  return replicateDb (from, to, options)
}

const getStatusOfDatabase = (db) => {
  return getStatusFromDb (db)
}

const createViewOnDatabase = (/*db, name, code*/) => {

}

export {
  openPWRemote,
  upsertJsonToDatabase,
  removeJsonFromDatabase,
  findJsonFromDatabase,
  createViewOnDatabase,
  createIndexOnDatabase,
  explainJsonFromDatabase,
  createViewOnDatabase,
}
