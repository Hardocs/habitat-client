
// these are habitat-hd abilities, rather than CloudDb itself
// *todo* open calls one way to do it, but a single call as next, and path strings is better

import {getStatusFromDb} from './transport-ifc';
import {loginViaModal, servicesLog} from './habitat-localservices';
import {createOrOpenDatabase} from './habitat-database';

const doRequest = (commandPath = '/get--wut-login-identity') => {
  console.log('commandHabitat: ' + commandPath)

  // something like the structure habitat-hd will use
  let result = {}
  const segments = commandPath.split('/')
  switch (segments[0]) {
    case 'get-login-identity':
      result = getLoginIdentity()
      break
    case 'create-owner':
      result = createOwner(decodeURIComponent(segments[1]))
      break
    case 'db-exists':
      result = dbExists(decodeURIComponent(segments[1]))
      break
    default:
      result = { ok: false, msg: 'No soap, no capability like: ' + commandPath }
      break
  }
  return result
}

// *todo* so these two will go out as soon as doRequest gets real
const getLoginIdentity = (dummyName = 'ggl/narrationsd') => {
  // *todo* convenience before the habitat-hd implementation
  return { ok: true, msg: 'Identity is ' + dummyName, identity: dummyName }
}

const createOwner = (dbName) => {
  // *todo* convenience before the habitat-hd implementation
  return { ok: true, msg: 'Created owner: ' + dbName, dbName: dbName }
}

const dbExists = (dbName) => {
  // *todo* convenience before the habitat-hd implementation
  return { ok: true, msg: dbName + ' isn\'t present', dbExists: false }
}

const assureRemoteLogin = (dbName) => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName)
    getStatusFromDb(db)
      .then (result => {
        servicesLog('assureRemoteLogin:checkStatus: ' + JSON.stringify(result))
        console.log ('logged in...')
        resolve ({ ok: true, msg: 'logged in to ' + dbName })
      })
      .catch(err => {
        // Be very careful here. There are different responses from the oauth2-proxy,
        // depending on what it knows. Without any previous oauth2 cookie, it 401s,
        // which means there isn't any expected JSON reply internally for the status check.
        // If it has the oauth2cookie but isn't able to verify a chosen identity,
        // then we get a different fail I think also from oauth2-proxy, where it refuses
        // the connection outright.
        //
        // Curious, actually, as the cases are really in some sense 401 and 403, but
        // what exists is they play it, and in any case, Pouch api doesn't let us see or
        // otherwise deal very sensibly, so we have to check the strings to act well ourselves.

        if (!err.toString().includes('Unexpected end of JSON input') // no oauth2 cookie
          && !err.toString().includes('Failed to fetch') // not logged in to identity
        ) {
          reject ({ ok: false, msg: 'assureRemoteLogin:unexpected: '
              + dbName + ' status check error: ' + err})
        } else {
          servicesLog('need to log in to ' + dbName + ', as rejected without identity')
          const dbPathOnly = dbName.split('/')
          const db = dbPathOnly.pop() // just the host, not the db
          const dbHost = dbPathOnly.join('/')
          loginViaModal(dbHost + '/sign_in')
            .then (result => {
              // console.log('assureRemoteLogin:logInViaModel result: ' + result + db)
              resolve ({ ok: true, msg: result + db })
            })
            .catch(err => {
              // console.log('assureRemoteLogin:logInViaModel error: ' + err)
              reject ({ ok: false, msg: err })
            })
        }
      })
  })
}

export {
  doRequest,
  assureRemoteLogin
}
