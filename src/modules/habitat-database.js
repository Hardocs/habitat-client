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

const loadProjectObject =  (locale = 'firstLocale',
                            project = 'firstProject',
                            identity) => {
  return new Promise ((resolve, reject) => {

    const projectId = keyFromParts(locale, project, identity)
    console.log ('projectId: ' + projectId)

    const db = createOrOpenDatabase(localDbName)
    getStatusFromDb(db)
      .then (result => {
        console.log ('loadProjectObject:status: ' + JSON.stringify(result))
        return getJsonFromDb(db, projectId)
      })
      .then (result => {
        console.log('loadProjectObject:result: ' + JSON.stringify(result))
        resolve ({ ok: true, msg: 'Loaded Db Project Object', data: result })
      })
      .catch (err => {
        reject (processError(err, 'loadProjectObject'))
      })
  })
}

// this is the local save, after editing,  and before any replications to the cloud
function processError (err, prefix = null) {
  // *todo* !!!! refactor all to stack-reporting method like this
  try {
    let msg = prefix
      ? 'error:' + prefix + ':'
      : 'error:'

    if (typeof err === 'Error') {
      msg += err.stack
    }
    else if (typeof err === 'object') {
      msg = err.stack
        ? err.stack
        : JSON.stringify(err)
    }
    else { // it should be a string
      msg += err
    }
    console.log ('error:' + msg)
    return { ok: false, msg: msg }
  } catch (e) {
    // abso nothing fancy in here, as above error processing has failed itself
    const msg = 'error in ProcessError!: ' + e.stack
    console.log (msg)
    return { ok: false, msg: msg }
  }
}


// The dataCallback method is essential, so app's Project gets updated
// also, must specify it as dataCallback.bind(this), otherwise failure,
// as 'this' will be that local to present method, not to the calling app.
// All care here means all simplicity in the app's use of this api
const storeProjectObject = (
  projectObject,
  dataCallback,
  dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {

    // establish timestamp we'll use and send back, where it's available
    // it's not important that it be at exact instant of upsert succeeding
    const timeStamp = Date.now()

    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('storeProjectObject:status: ' + JSON.stringify(result))

        // let's use our repaired version of the utility
        const upsertFunction = (doc) => {
          // note that we crucially use moment of saving work, not of upload,
          // as it's when the work is saved locally that makes it current

          // Do not touch; as our own conflict resolution stage abilities begin here

          doc.timestamp = timeStamp

          // this is where we actually update these in, thus if other
          // Hardocs Object elements are added, must write those here too

          doc.hdFrame = projectObject.hdFrame
          doc.hdObject = projectObject.hdObject

          // for our needs, all values here can and must always be the same
          return doc
        }
        return upsertJsonToDb (db, projectObject._id, upsertFunction)
      })
      .then(result => {

        // we don't care about result.updated, or its meaning, since our
        // upsert callback always operates; dosen't

        if (!result.updated) {
          throw new Error ("local project upsert failed")
        }

        // careful here also:  add timestamp in here also, as result only gives
        // the updated rev with id, not the updated object
        result = Object.assign(result, { timestamp: timeStamp })

        console.log ('storeProjectObject result: ' + JSON.stringify(result))
        dataCallback (result) // our essential step...so original Project updates

        resolve({
          ok: true,
          msg: 'Project saved locally',
          data: result }
        ) // we also return it, in local style
      })
      .catch(err => {
        reject(processError(err, 'storeProjectObject'))
      })
  })
}

// this is used to save with no _rev change, used for our replicate-replacing protocol
const storeProjectObjectSameRev = (habitatObject, dbName = 'habitat-projects') => {
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then(result => {
        console.log('storeProjectObjectSameRev:status: ' + JSON.stringify(result))
        // console.log ('storeHardocsObject:data: ' + JSON.stringify(data))
        return
      })
      .then (() => {
        console.log ('about to store')
        return putJsonToDb(db, habitatObject, { new_edits: false })
      })
      .then(result => {
        console.log ('storeProjectObjectSameRev: ' + JSON.stringify(result))
        result.ok = true
        resolve(
          {
            ok: true,
            msg: 'Project stored with same rev',
            data: result.data
          }
        )
      })
      .catch(err => {
        console.log('storeProjectObjectSameRev:err: ' + err)
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

// this is no longer something that can be done, as Habitat is properly locked down
// the exception would be by superAdmin, and for testing much later inter-cloud, we leave it
const replicateFromToDatabase = (from, to, options = {}) => {
  const fromDb = createOrOpenDatabase(from)
  const toDb = createOrOpenDatabase(to)

  // a little status checking Promise surround here...before this ever gets used

  return replicateDb(fromDb, toDb, options)
}

const keyFromParts = (locale, project, identity) => {
  return locale + ':' + project + ':' + identity
}

export {
  createOrOpenDatabase,
  getStatusOfDb,
  loadProjectObject,
  clearDatabase,
  listLocaleProjects,
  storeProjectObject,
  storeProjectObjectSameRev,
  updateProjectObject,
  replicateFromToDatabase,
  keyFromParts
}
