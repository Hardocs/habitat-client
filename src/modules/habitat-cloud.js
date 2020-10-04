
// these are habitat-hd abilities, rather than CloudDb itself
// *todo* open calls one way to do it, but a single call as next, and path strings is better

import {getStatusFromDb} from './transport-ifc';
import {getNodeCookies, loginViaModal, servicesLog} from './habitat-localservices';
import {createOrOpenDatabase} from './habitat-database';

// it's critical to have PouchDb's fetch(), to get our auth cookies through when doing _commands_
import { fetch } from 'pouchdb-fetch/lib/index-browser.es'

const doRequest = (commandPath = '/get--wut-login-identity') => {
  console.log('commandHabitat: ' + commandPath)

  // something like the structure habitat-hd will use
  let result = {}
  const segments = commandPath.split('/')
  console.log('doRequest:segments: ' + JSON.stringify(segments))

  switch (segments[0]) {
    case 'get-login-identity':
      result = getLoginIdentity()
      break
    case 'create-owner':
      result = createOwner(segments[1], segments[2])
      break
    case 'db-exists':
      result = dbExists(decodeURIComponent(segments[1]))
      break
    case 'initialize-cloud':
      result = initializeCloud(segments[1])
      break
    default:
      console.log('doRequest: defaulting, no match')
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

// n.b. here.  This is an implementation which actually functions, getting
// our commands through to their processor layer in the hd-habitat cloud.
// There are several critical things, entirely invisible until discovered.
// One is to set credentials to be included, without which all will fail.
// More critical yet, is to use PouchDb's _browser_ fetch() -- which leads to
// un-named _native_, portentially the actual browser's, or something they made.
// There is no other fetch() of many kinds tried that will work, and I am
// surprised that this one does, as it manages to make a call on the web
// which allows the browser's cookies through. That fact is crucial, as it is
// again by experiment, the only way that the _oauth2_proxy cookie will be
// returned to it, in turn the only way our highly recommended security proxy
// will allow anything through.
//
// So, it works. What if it doesn't in some future time?  This is unlikely, as
// this particular fetch() of theirs is central and crucial to PouchDb's ability
// of every kind to interact with CloudDb on the net, their complete intention.
//
// But if somehow that fails, we can engage a workaround, less desirable becaause
// it will allow visibility of our commands. This would likely not a particular hazard,
// if we like to keep things private as a security  practice, because the combination
// of the proxy's requirement of proven identity, and that we will only permit certain
// identities to use administrative commands, should keep away any uses of what
// an ill-doer might observve.  In the end, it's not different from the security of all
// CouchDb commands, which are often in the open this way.
//
// This argument would be true, because the workaround would be to _extend_ on one
// of the normal CouchDb commands. If we add our command strings beyond the end of
// the path sequence possible for a normal db command, we can pick that off and
// then divert in the command layer, so that we use and return from what we sent,
// and the CouchDb instance never sees it. But again, what we have now should be
// most secure, and there is little reason to suspect it would ever become unavailable.
//
// These notes will move along with the code, at such time that we modularize
// the overall cloud command abilities.
const createOwner = (dbName, url) => {
  // *todo* convenience before the more competent habitat-hd implementation
  dbName = decodeURIComponent(dbName)
  url = decodeURIComponent(url) + '/habitat-request'
  console.log('client requesting cloud create owner: ' + dbName + ', url: ' + url)
  const body = {
    name: dbName,
    cmd: 'discovery',
    json: true
  }
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json', // 'text/plain'
    }),
  })
    .then(result => {
      // console.log ('result: ' + JSON.stringify(result))
      // console.log ('result raw: ' + result)
      const type = result.headers.get('Content-Type')
      console.log ('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return { ok: true, msg: 'Created owner: ' +
            ', (string) ' + result, dbName: dbName}
      } else {
        return { ok: result.ok, msg: 'Created owner: ' + dbName +
            ', ' + result.msg, dbName: dbName}
        }
    })
    .catch(err => {
      console.log('createOwner:error ' + err)
      return {ok: false, msg: 'cmd:createOwner:error: ' + err, dbName: dbName}
    })
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
              + dbName + ' status check error: ' + JSON.stringify(err)})
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

const initializeCloud = (url) => {

  let body = {}
  try {
    url = decodeURIComponent(url) + '/habitat-request'
    console.log('client requesting cloud initialize: ' + url)
    body = {
      name: 'initializing', // *todo* sort out meanings and/or english for command
      cmd: 'initializeHabitat',
      json: true
    }
  } catch (e) {
    console.log('initial catch' + 'initializeCloud:error: ' + e)
    return new Promise.reject({ok: false, msg: 'initializeCloud:error: ' + e})
  }

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json', // 'text/plain'
    }),
  })
    .then(result => {  // fetch returns a Result object, must decode
      const type = result.headers.get('Content-Type')
      console.log ('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      console.log('fetch result: ' + JSON.stringify(result))
      return result
    })
    .catch(err => {
      console.log('fetch err: ' + JSON.stringify(err))
      return err
    })
}

export {
  doRequest,
  assureRemoteLogin
}
