
// these are habitat-hd abilities, rather than CloudDb itself
// *todo* open calls one way to do it, but a single call as next, and path strings is better
// *todo* get a controllable logger in here and elsewhere, so no console unless set

// *todo* !! document how our doRequest avoids visibility for almost all db ops

import {getStatusFromDb, safeEnv} from './transport-ifc';
import {getNodeCookies, loginViaModal, servicesLog} from './habitat-localservices';
import {createOrOpenDatabase} from './habitat-database';

// it's critical to have PouchDb's fetch(), to get our auth cookies through when doing _commands_
import { fetch } from 'pouchdb-fetch/lib/index-browser.es'

const publicCloud = safeEnv(process.env.PUBLIC_CLOUD,
  'https://hd.narrationsd.com/hard-api/habitat-public')

const doRequest = (command = 'get-login-identity', url, args = {}) => {
  console.log('habitat-cloud:doRequest: <' + command +
    ', args: ' + JSON.stringify(args) + '>')

  let result = {}

  // this is kept for flexibility, though many commands simplify just to use { arguments }
  switch (command) {
    case 'getLoginIdentity':
      result = getLoginIdentity(url)
      break
    case 'checkRoles':
      result = checkRoles(url)
      break
    case 'createLocale':
      result = createLocale(url, args)
      break
    case 'createProject':
      result = createProject(url, args)
      break
    case 'loadProject':
      result = loadProject(url, args)
      break
    case 'resolveConflicts':
      result = resolveConflicts(url, args)
      break
    case 'updateHabitatProject':
      result = updateHabitatProject(url, args)
      break
    case 'addProjectMember': // *todo* sounds this goes out - check
      result = addProjectMember(url, args)
      break
    case 'dbExists':
      // *todo* isn't this decode a leftover; do without?
      result = dbExists(decodeURIComponent(url))
      break
    case 'initializeCloud':
      result = initializeCloud(url)
      break
    case 'tryGql':
      result = tryGql(url, args)
      break
    case 'publishProject':
      result = publishProject(url, args)
      break
    default:
      console.log('doRequest: habitat-client defaulting, no match')
      result = { ok: false, msg: 'No soap, no capability like: ' + command }
      break
  }
  return result
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
const createLocale = (url, { locale, identity }) => {
  console.log('client requesting cloud create locale: ' + identity + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'create locale: ' + locale, // *todo* sort out meanings and/or english for command
    cmd: 'createLocale', // *todo* settle this. Locale all around better? Or third word?
    identity: identity,
    locale: locale,
    json: true
  }

  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true, msg: 'Creating locale: ' +
            ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok, msg: 'Creating locale: ' + locale +
            ', ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('createLocale:error ' + err)
      return {ok: false, msg: 'cmd:createLocale:error: ' + err }
    })
}

const createProject = (url, { project, locale, identity }) => {
  console.log('client requesting cloud create project: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'create project: ' + project + ', locale: ' +
      locale + ', identity: ' + identity, // *todo* sort out meanings and/or english for command
    cmd: 'createProject',
    project: project,
    locale: locale,
    identity: identity,
    json: true
  }

  console.log('createProject:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'Creating project: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'Creating project: ' + project + ', ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('createProject:error ' + err)
      return {ok: false, msg: 'cmd:createProject:error: ' + err, project: project}
    })
}

const loadProject = (url, { project, locale, identity, options = {} }) => {
  console.log('client requesting cloud load project: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url, ', options: ' + JSON.stringify(options))

  url += '/habitat-request'
  const body = {
    name: 'load project: ' + project + ', locale: ' +
      locale + ', identity: ' + identity, // *todo* sort out meanings and/or english for command
    cmd: 'loadProject',
    project: project,
    locale: locale,
    identity: identity,
    options: JSON.stringify(options),
    json: true
  }

  console.log('loadProject:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        console.log('returning from string result')
        return {
          ok: true,
          msg: result
        }
      } else {
        console.log('returning from json object result')
        return {
          ok: result.ok,
          msg: result.msg
        }
      }
    })
    .catch(err => {
      console.log('createProject:error ' + err)
      return {ok: false, msg: 'cmd:loadProject:error: ' + err, project: project}
    })
}

const updateHabitatProject = (url, { locale, project, projectData, options }) => {
  console.log('client requesting cloud update project: ' + projectData._id + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'updateHabitatProject: ' + projectData._id,
    cmd: 'updateHabitatProject',
    locale: locale,
    project: project,
    projectData: projectData,
    options: options,
    json: true
  }

  console.log('updateProject:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)

      // *todo* !!! surely a method for boilerplate that follows, asap
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'Updating project: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'Updating project: ' + projectData._id + ', ' + result.msg
        }
      }
    })
    .catch(err => {
      const msg = 'updateHabitatProject:error: ' + err.stack
      console.log(msg)
      return {ok: false, msg: msg }
    })
}

const resolveConflicts = (url, {project, locale, identity, options = {resolve: 'mine'}}) => {
  console.log('client requesting cloud resolve project: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'create project: ' + project + ', locale: ' +
      locale + ', identity: ' + identity, // *todo* sort out meanings and/or english for command
    cmd: 'resolveConflicts',
    project: project,
    locale: locale,
    identity: identity,
    options: JSON.stringify(options),
    json: true
  }

  console.log('resolveConflicts:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'Resolve conflicts: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'Resolve conflicts:project: ' + project + ', ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('resolve conflicts:error ' + err)
      return {ok: false, msg: 'cmd:resolveConflicts:error: ' + err, project: project}
    })
}

const addProjectMember = (url, { project, locale, member }) => {
  console.log('client requesting cloud add project member: ' + project + ', locale: ' + locale +
    ', member: ' + member + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'add project member: ' + project + ', locale: ' +
      locale + ', member: ' + member, // *todo* sort out meanings and/or english for command
    cmd: 'addProjectMember',
    project: project,
    locale: locale,
    member: member,
    json: true
  }

  console.log('addProjectMember:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'Added member: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'Added member: ' + member + ', ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('addProjectMember:error ' + err)
      return {ok: false, msg: 'cmd:addProjectMember:error: ' + err, member: member}
    })
}

const tryGql = (url, { query }) => {
  console.log('client requesting cloud gql api query: ' + query)

  url += '/habitat-request'
  const body = {
    name: 'try gql query: ' + query, // *todo* sort out meanings and/or english for command
    cmd: 'tryGql',
    query: query,
    json: true
  }

  console.log('tryGql:body: ' + JSON.stringify(body))
  // *todo* preliminaries only so far
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'gql result: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: result.msg
        }
      }
    })
    .catch(err => {
      // *todo* gql return now correct either way, but test protocol
      // *todo* error in the chain now vs. app?
      console.log('tryGql:error ' + err)
      return {ok: false, msg: err }
    })
}

const publishProject = (url, { status, locale, project }) => {
  console.log('client requesting publish: ' + status
    + ' for ' + locale + ' - ' + project)

  url += '/habitat-request'
  const body = {
    name: 'set publish state: ' + + status
      + ' for ' + locale + ' - ' + project,
    cmd: 'publishProject',
    publishStatus: status,
    locale: locale,
    project: project,
    json: true
  }

  console.log('publishProject:body: ' + JSON.stringify(body))

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    // *todo* these blocks ought to be able to be out now, as we are
    // set on string results?  Or both stages should be refactored into routine
    .then(result => {
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
      if (type.includes('text/plain')) {
        return result.text()
      } else {
        return result.json()
      }
    })
    .then(result => {
      if (typeof result !== 'object') {
        return {
          ok: true,
          msg: 'publishProject result: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'publishProject result: ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('tryGql:error ' + err)
      return {ok: false, msg: 'cmd:tryGql:error: ' + err }
    })
}

const dbExists = (dbName) => {
  // *todo* convenience before the habitat-hd implementation
  return { ok: true, msg: dbName + ' isn\'t present', dbExists: false }
}

const initializeCloud = (url) => {

  console.log('client requesting cloud initialize: ' + url)
  const body = {
    name: 'initializing', // *todo* sort out meanings and/or english for command
    cmd: 'initializeHabitat',
    json: true
  }

  return habitatRequest(url, body)
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

const getLoginIdentity = (url) => {

  const body = {
    name: 'get login identity', // *todo* sort out meanings and/or english for command
    cmd: 'getLoginIdentity',
    json: true
  }
  console.log('client requesting login identity: ' + url + ', body: ' + JSON.stringify(body))

  return habitatRequest(url, body)
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

const checkRoles = (url) => {

  const body = {
    name: 'check roles', // *todo* sort out meanings and/or english for command
    cmd: 'checkRoles',
    json: true
  }
  console.log('client requesting roles: ' + url + ', body: ' + JSON.stringify(body))

  return habitatRequest(url, body)
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

function habitatRequest (url, body) {

  url += '/habitat-request'

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json', // 'text/plain'
    }),
  });
}

const assureRemoteLogin = (dbName = publicCloud) => {
  return new Promise ((resolve, reject) => {
    const db = createOrOpenDatabase(dbName, { skip_setup: true }) // don't attempt create
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

export {
  doRequest,
  assureRemoteLogin
}
