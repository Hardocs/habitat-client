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
  getJsonFromDb, putJsonToDb, upsertJsonToDb,
  deleteDocument, destroyDb,  // *todo* out later
  alldocsJsonFromDb, replicateDb, removeJsonFromDb
} from './transport-ifc'
import {
  loginViaModal,
  servicesLog
} from './habitat-localservices'

// *todo* rationalize all these calls after discovery; ones we don't need, ones non-completed

const localDbName = 'habitat-projects' // will always be, matching Habitat HD

const readLocalProjectObject =  (locale = 'firstLocale',
                            project = 'firstProject',
                            identity) => {
  return new Promise ((resolve, reject) => {

    const projectId = keyFromParts(locale, project, identity)
    console.log ('projectId: ' + projectId)

    const db = createOrOpenDatabase(localDbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('readLocalProjectObject:status: ' + JSON.stringify(result))
        return getJsonFromDb(db, projectId)
      })
      .then (result => {
        console.log('readLocalProjectObject:result: ' + JSON.stringify(result))
        // be consistent in our messaging, result always a string
        const dbContent = { ok: true, msg: JSON.stringify(result)}
        resolve (dbContent)
      })
      .catch (err => {
        console.log ('readLocalProjectObject:error: ' + err)
        reject (err)
      })
  })
}


// *todo* skeleton not at all right or necessarily needed - see design progress
const loadHabitatObject =  (locale = 'habitat-projects',
                            project = 'firstProject') => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(locale)
    getStatusFromDb(db)
      .then (result => {
        console.log ('loadHabitatObject:status: ' + JSON.stringify(result))
        console.log ('loadHabitatObject:key: ' + keyFromParts(locale, project))
        return getJsonFromDb(db, project)
      })
      .then (result => {
        console.log('loadHabitatObject:result: ' + JSON.stringify(result))
        resolve (result)
      })
      .catch (err => {
        console.log ('loadHabitatObject:error: ' + err)
        reject (err)
      })
  })
}

// *todo* skeleton not at all right or necessarily needed - see design progress
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


// this is the local save, after editing,  and before any replications to the cloud
// we should merge ts and save HabitatObject, with an argument whether to timestamp or not
const saveProjectObject = (projectObject, clear = false, dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('saveProjectObject:status: ' + JSON.stringify(result))

        // let's use our repaired version of the utility
        const updateFunction = (doc) => {
          // note that we use moment of saving work, not of upload
          // now() can drift slightly, but only possible, and good enough for us


          // some notes to merge, or on the other side
          // crucial: here is where the timestamp needs to be updated,
          // as it is the workstation's save time that should win.
          // n.b. we are not interested in when it may update, even if that
          // at present could be at the same time. In future stages, definitely not.
          // habitatObject.timestamp = Date.now()
          // Do not touch; as our own conflict resolution stages begin here

          doc.timestamp = Date.now(),
          doc.hdFrame = projectObject.hdFrame
          doc.hdObject = projectObject.hdObject
          return doc
        }
        return upsertJsonToDb (db, projectObject._id, updateFunction)
      })
      .then(result => {
        console.log ('saveProjectObject result: ' + JSON.stringify(result))
        resolve(result)
      })
      .catch(err => {
        console.log('saveProjectObject:error: ' + err)
        reject(err)
      })
  })
}

// this is used at present to save from loading cloud version
const saveHabitatObject = (habitatObject, clear = false, dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('saveHabitatObject:status: ' + JSON.stringify(result))
        // console.log ('storeHardocsObject:data: ' + JSON.stringify(data))
        return
      })
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
  return 'not implemented yet'  // *todo* and not going to be, looks like (replicate does)
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

  // and now we know a good reason this comes last.
  // - must delete all revisions remaining - use bulkDelete
  // - for sanity, must do this both locally and in cloud, lest miss any
  // - thus, this is a cloud-only operation. Some safety in that as well?
}

const listLocaleProjects =  (locale = '', dbName = 'hardocs-projects') => {
  console.log('listLocaleProjects not yet using locale: ' + locale)
  // *todo* this is far from ready yet as well - as it depends on locale
  // can we depend on cdb to do trawl without a view, on hardocs-projects?

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

// *todo this goes out, or if needed, renames as replicateFromToDatabase
const replicateDatabase = (from, to, options = {}) => {
  const fromDb = createOrOpenDatabase(from)
  const toDb = createOrOpenDatabase(to)

  // *todo* a little status checking Promise surround here...pronto??

  return replicateDb(fromDb, toDb, options)
}

const keyFromParts = (locale, project, identity) => {
  return locale + ':' + project + ':' + identity
}

export {
  createOrOpenDatabase,
  getStatusOfDb,
  loadHabitatObject,
  storeHardocsObject,
  clearDatabase,
  listLocaleProjects,
  readLocalProjectObject,
  saveProjectObject,
  saveHabitatObject,
  updateProjectObject,
  replicateDatabase,
  keyFromParts
}
