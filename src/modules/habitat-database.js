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

// we never use async/await, because we want the UX to respond, not block. That its
// viewed data comes later after action to prepare for it, is natural, is expected.

import {
  createOrOpenDb, getStatusFromDb,
  getJsonFromDb, putJsonToDb,
  deleteDocument, destroyDb,  // *todo* out later
  alldocsJsonFromDb, replicateDb, removeJsonFromDb
} from './transport-ifc'
import {
  loginViaModal,
  servicesLog
} from './habitat-localservices'

const loadHardocsObject =  (locale = 'habitat-projects',
                                 project = 'firstProject') => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(locale)
    getStatusFromDb(db)
      .then (result => {
        console.log ('loadHardocsObject:status: ' + JSON.stringify(result))
        console.log ('loadHardocsObject:key: ' + keyFromParts(locale, project))
        return getJsonFromDb(db, project)
      })
      .then (result => {
        console.log('loadHardocsObject:result: ' + JSON.stringify(result))
        resolve (result)
      })
      .catch (err => {
        console.log ('loadHardocsObject:error: ' + err)
        reject (err)
      })
  })
}

const storeHardocsObject = (locale, project, data = {}) => {

  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(locale)
    getStatusFromDb(db)
      .then (result => {
        console.log ('storeHardocsObject:status: ' + JSON.stringify(result))
        // console.log ('storeHardocsObject:data: ' + JSON.stringify(data))
        return upsertProjectLocal(locale, project, data)
      })
      .then(result => {
        // console.log ('storeHardocsObject:upsert ' + JSON.stringify(result))
        if (!result.ok) { // errors won't throw of themselves, thus we test
          reject (result)
        }
        resolve (result)
      })
      .catch (err => {
        console.log ('storeHardocsObject:error: ' + err)
        reject (err)
      })
  })
}

// upsert is a service needed internally, not to be exposed, as it handles a
// particular case of store to database. Also to change implementation
// to match emerging cloud.
const upsertProjectLocal = (locale, project, data) => {
  // *todo* seems to work as expected, but is a little different from lib - check
  return new Promise ((resolve, reject) => {
    let projectData = {
      _id: project,
      locale: locale,
      data: data
    }
    // first, see if we have the project already
    getJsonFromDb(locale, project)
      .then(result => {
        // console.log('upsertProjectLocal:getJsonFromDb: ' + JSON.stringify(result))
        if (result) {
          // console.log('assigning: data: ' + JSON.stringify(data))
          const assigned = Object.assign(result, { data: data })
          console.log('previous data; assigned ok') // data: ' + JSON.stringify(data))
          return assigned
        } else {
          throw new Error ('upsertProjectLocal:getJsonFromDb:error:no prior resul!')
        }
      })
      .catch (err => {
        console.log('upsertProjectLocal:no earlier data, initial put. ')
        return projectData
        })
      .then(result => {
        // console.log('upsertProjectLocal:tostore: ' + JSON.stringify(result))
        return putJsonToDb(locale, result)
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

// this is the local save, after editing,  and before any replications to the cloud
const saveProjectObject = (habitatObject, clear = false, dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('saveProjectObject:status: ' + JSON.stringify(result))
        return putJsonToDb(db, habitatObject)
      })
      .then(result => {
        // console.log ('saveProjectObject result: ' + JSON.stringify(result))
        resolve(result)
      })
      .catch(err => {
        console.log('saveProjectObject:error: ' + err)
        reject(err)
      })
  })
}

const saveHabitatObject = (habitatObject, clear = false, dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('saveHabitatObject:status: ' + JSON.stringify(result))
        // console.log ('storeHardocsObject:data: ' + JSON.stringify(data))
        return
      })
      // .then(() => {
      //   // if (clear) {
      //   //   try {
      //   // return deleteDocument (db, habitatObject)
      //   return removeJsonFromDb (db, habitatObject)
      //   //   }
      //   //   catch (err) {
      //   //     console.log ('delete project error: ' + JSON.stringify(err))
      //   //     console.log ('delete project error string: ' + err)
      //   //   }
      //   // }
      //   // return // is needed?
      // })
      // .catch(err => {
      //   console.log ('delete error: ' + JSON.stringify(err))
      // })
      .then (() => {
        console.log ('about to store')
        return putJsonToDb(db, habitatObject, { new_edits: false })
      })
      .then(result => {
        console.log ('saveHabitatObject: ' + JSON.stringify(result))
        result.ok = true
        resolve(result)
      })
      .catch(err => {
        console.log('saveHabitatObject:err: ' + err)
        reject(err)
      })
  })
}

const updateProjectObject = (/*db, hardocsObject*/) => {
  return 'not implemented yet'
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


const createOrOpenDatabase = (dbName, opts = {}, locale = 'electron-browser') => {
  let db = null
  switch(locale) {
    case 'electron-browser':
      db = createOrOpenDb(dbName, opts)
      break

    case 'cloud-reach':
    default:
      throw new Error ('only electron-browser-local database from app...')
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

const deleteProject = (db, project) => {
  throw new Error ({ ok: false, msg: 'deleteProject not implemented yet'})
}

const listLocaleProjects =  (locale = '', dbName = 'hardocs-projects') => {
  console.log('listLocaleProjects not yet using locale: ' + locale)
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        console.log('loadProjectFromDatabase:status: ' + JSON.stringify(result))
      })
      .then (() => {
        // const key = keyFromParts(locale, '*')
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

const keyFromParts = (locale, project) => {
  return locale + ':' + project
}

export {
  createOrOpenDatabase,
  getStatusOfDb,
  loadHardocsObject,
  storeHardocsObject,
  clearDatabase,
  listLocaleProjects,
  saveProjectObject,
  saveHabitatObject,
  updateProjectObject,
  replicateDatabase,
  keyFromParts
}
