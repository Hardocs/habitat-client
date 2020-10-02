// this is the module for all data requests (and any saves) for Hardocs apps.
//
// It abstracts and simplifies any interaction with the filesystem or database.

// Lots of important n.b. follow...

// Ths layer enables different habutat-database drivers to be used in future,
// employing for example CombatCovid or other security motifs, without changes
// to Hardocs application code, a primary reason to use it.

// We must always be Promises in here -- because the UX will need that.
// Data is never returned at the time called; it is always by callbacks,
// in event time, not clock time. Thus we reflect this back, and the promise
// eventual results are put right into the UX data, to be immediately displayed.

// we never use async/await, because we want the UX to respond,not block. That its
// viewed data comes later after action to prepare for it, is natural, is expected.

import {
  createOrOpenDb, getStatusFromDb,
  getJsonFromDb, putJsonToDb,
  destroyDb,  // *todo* out later
  alldocsJsonFromDb, replicateDb
} from './transport-ifc'
import {
  loginViaModal,
  servicesLog
} from './habitat-localservices'

// Both load and store are due soon to change internal implementation,
// to match the cloud side now emerging. Signatures have already changed,
// noting it's Projects they deal with.
const loadProjectFromDatabase =  (owner = 'hardOwner', project = 'firstProject',
                           dbName = 'hardocs-projects', ) => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('loadProjectFromDatabase:status: ' + JSON.stringify(result))
        console.log ('loadProjectFromDatabase:key: ' + keyFromParts(owner, project))
        return getJsonFromDb(db, keyFromParts(owner, project))
      })
      .then (result => {
        console.log('loadProjectFromDatabase:result: ' + JSON.stringify(result))
        resolve (result)
      })
      .catch (err => {
        console.log ('loadProjectFromDatabase:error: ' + err)
        reject (err)
      })
  })
}

const storeProjectToDatabase = (owner, project,
                        data = {}, dbName = 'hardocs-projects') => {

  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('storeProjectToDatabase:status: ' + JSON.stringify(result))
        // console.log ('storeProjectToDatabase:data: ' + JSON.stringify(data))
        return upsertProjectToDatabase(owner, project, data, db)
      })
      .then(result => {
        // console.log ('storeProjectToDatabase:upsert ' + JSON.stringify(result))
        if (!result.ok) { // errors won't throw of themselves, thus we test
          reject (result)
        }
        resolve (result)
      })
      .catch (err => {
        console.log ('storeProjectToDatabase:error: ' + err)
        reject (err)
      })
  })
}

// upsert is a service needed internally, not to be exposed, as it handles a
// particular case of store to database. Also to change implementation
// to match emerging cloud.
const upsertProjectToDatabase = (owner, name, data, db) => {
  // *todo* seems to work as expected, but is a little different from lib - check
  return new Promise ((resolve, reject) => {
    const id = keyFromParts(owner, name)
    let projectData = {
      _id: id,
      owner: owner,
      name: name,
      data: data
    }
    // first, see if we have the project already
    getJsonFromDb(db, id)
      .then(result => {
        // console.log('upsertProjectToDatabase:getJsonFromDb: ' + JSON.stringify(result))
        if (result) {
          // console.log('assigning: data: ' + JSON.stringify(data))
          const assigned = Object.assign(result, { data: data })
          console.log('assigned ok') // s: data: ' + JSON.stringify(data))
          return assigned
        } else {
          throw new Error ('upsertProjectToDatabase:getJsonFromDb:error:no prior result!')
        }
      })
      .catch (err => {
        console.log('upsertProjectToDatabase: ' + err)
        return projectData
        })
      .then(result => {
        // console.log('upsertProjectToDatabase:tostore: ' + JSON.stringify(result))
        return putJsonToDb(db, result)
      })
      .then (result => {
        // console.log ('putJsonToDb: ' + JSON.stringify(result))
        resolve(result)
      })
      .catch(err => {
        console.log('upsert:err: ' + err)
        reject(err)
      })
  })
}

const getStatusOfDb =  (dbName = 'hardocs-projects') => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('loadProjectFromDatabase:status: ' + JSON.stringify(result))
        resolve(result)
      })
      .catch (err => {
        console.log ('getStatusOfDb:error: ' + err)
        reject (err)
      })
  })
}


const createOrOpenDatabase = (dbName, locale = 'electron-browser') => {
  let db = null
  switch(locale) {
    case 'electron-browser':
      db = createOrOpenDb(dbName)
      break

    case 'lab-local':
    case 'cloud-reach':
    default:
      throw new Error ('only electron-browser-local database at present...')
    // lint, huh...
    // break
  }
  return db
}

// *todo* n.b. this will not be a user-available call, soon and in the real Hardocs!!
// it is dangerous, and we are providing temporarily only to make development modeling experiments easy
// *todo* it will be removed soon, finding a place on the protected cloud side only
const clearDatabase = (dbName = 'hardocs-projects') => {
  return new Promise ((resolve, reject) => {

    if (dbName.includes('http')) {
      reject ('no clearing of remote databases, ever!! Only local, for development testing')
    }

    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('clearDatabase:status: ' + JSON.stringify(result))
        // console.log ('clearDatabase:data: ' + JSON.stringify(data))
        return destroyDb(db)
      })
      .then(result => {
        // console.log ('clearDatabase:upsert ' + JSON.stringify(result))
        // if (!result.ok) { // errors won't throw of themselves, thus we test
        //   reject (result)
        // }
        resolve (result)
      })
      .catch (err => {
        console.log ('clearDatabase:error: ' + err)
        reject (err)
      })
  })
}

const listOwnerProjects =  (owner = '', dbName = 'hardocs-projects') => {
  console.log('listOwnerProjects not yet using owner: ' + owner)
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log('loadProjectFromDatabase:status: ' + JSON.stringify(result))
      })
      .then (() => {
        // const key = keyFromParts(owner, '*')
        return alldocsJsonFromDb(db, { include_docs: true })
      })
      .then (result => {
        resolve(result)
      })
      .catch (err => {
        console.log ('getStatusOfDb:error: ' + err)
        reject (err)
      })
  })
}

const replicateDatabase = (from, to, options = {}) => {
  const fromDb = createOrOpenDatabase(from)
  const toDb = createOrOpenDatabase(to)
  // *todo* a little status checking Promise surround here...pronto

  return replicateDb(fromDb, toDb, options)
}

const keyFromParts = (owner, project) => {
  return owner + ':' + project
}

export {
  createOrOpenDatabase,
  loadProjectFromDatabase,
  storeProjectToDatabase,
  clearDatabase,
  getStatusOfDb,
  listOwnerProjects,
  replicateDatabase,
  keyFromParts
}
