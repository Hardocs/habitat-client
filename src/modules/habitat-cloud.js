// these are habitat-hd abilities, rather than CloudDb itself
// *todo* open calls one way to do it, but a single call as next, and path strings is better
// *todo* get a controllable logger in here and elsewhere, so no console unless set

// *todo* !! document how our doRequest avoids visibility for almost all db ops
// *todo* !! probably a lot of refactors into fetch routine, but watch the specificts,
// *todo* !! and let's safely keep text or json ability, while settling practice at this point

// a statement of policy 09Jun 2021 is that all routines should return a standard
// object, with ok, potential msg, and data separately if that's provided. This should
// all occur in the cloud, and that will mean it's normally json coming here, if we
// sensibly keep the way open for simple text at least for now.

import {getStatusFromDb, safeEnv} from './transport-ifc';
import {loginViaModal, servicesLog} from './habitat-localservices';
import {createOrOpenDatabase} from './habitat-database';

// it's critical to have PouchDb's fetch(), to get our auth cookies through when doing _commands_
import {fetch} from 'pouchdb-fetch/lib/index-browser.es'

const publicCloud = safeEnv(process.env.PUBLIC_CLOUD,
  'https://hd.narrationsd.com/hard-api/habitat-public')

// we're not actually entertaining string results any more, but
// if we would in future, this safeties those and errors also
// as far as values, all life is a Promise, no?
// *todo* !!! needs to be applied everywhere
function handleHabitatCloudResult (promiseResult) {

  const typedResult = (result) => {
    const type = result.headers.get('Content-Type')
    console.log('result content type: ' + type)
    if (type.includes('text/plain')) {
      return result.text()
    } else {
      return result.json()
    }
  }

  return Promise.resolve(typedResult(promiseResult))
    .then (result => {

      console.log ('typed from promises result is: ' + result)

      if (typeof result !== 'object') {
        console.log('returning from string result')
        return {
          ok: true,
          data: {no: 'data'},
          msg: result
        }
      } else {
        console.log('returning from json object result: ' + result)
        // we parse here, so the app doesn't have to
        // be careful: thrown errors in cloud won't have data returning
        let data = result.data
          ? JSON.parse(result.data) // unexpected errors caught in calling routine
          : {}

        return {
          ok: result.ok,
          data: data,
          msg: result.msg
        }
      }
    })
}

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
    case 'deleteLocale':
      result = deleteLocale(url, args)
      break
    case 'createProject':
      result = createProject(url, args)
      break
    case 'deleteProject':
      result = deleteProject(url, args)
      break
    case 'loadProjectUnresolved':
      result = loadProjectUnresolved(url, args)
      break
    case 'loadProjectResolve':
      result = loadProjectResolve(url, args)
      break
    case 'uploadProject':
      result = uploadProject(url, args)
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
      result = {ok: false, msg: 'No soap, no capability like: ' + command}
      break
  }
  return result
}

// n.b. here.  This is an implementation which actually functions, getting
// our commands through to their processor layer in the hd-habitat cloud.
// There are several critical things, entirely invisible until discovered.
// One is to set credentials to be included, without which all will fail.
// More critical yet, is to use PouchDb's _browser_ fetch() -- which leads to
// un-named _native_, potentially the actual browser's, or something they made.
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
// But if somehow that fails, we can engage a workaround, less desirable because
// it will allow visibility of our commands. This would likely not a particular hazard,
// if we like to keep things private as a security  practice, because the combination
// of the proxy's requirement of proven identity, and that we will only permit certain
// identities to use administrative commands, should keep away any uses of what
// an ill-doer might observe.  In the end, it's not different from the security of all
// CouchDb commands, which are often in the open this way.
//
// This argument would be true, because the workaround would be to _extend_ on one
// of the normal CouchDb commands. If we add our command strings beyond the end of
// the path sequence possible for a normal db command, then we can pick that off and
// then divert in the command layer, so that we use and return from what we sent,
// while the CouchDb instance never sees it. But again, what we have now should be
// most secure, and there is little reason to suspect it would ever become unavailable.
//
// These notes will move along with the code, at such time that we modularize
// the overall cloud command abilities.
const createLocale = (url, {locale, identity}) => {
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
      return {ok: false, msg: 'cmd:createLocale:error: ' + err}
    })
}

const createProject = (url, {project, locale, identity}) => {
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

const loadProjectUnresolved = (url, {project, locale, identity, options = {}}) => {
  console.log('client requesting cloud load project: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url, ', options: ' + JSON.stringify(options))

  url += '/habitat-request'
  const body = {
    name: 'download unresolved project: ' + project + ', locale: ' +
      locale + ', identity: ' + identity, // *todo* sort out meanings and/or english for command
    cmd: 'loadProjectUnresolved',
    project: project,
    locale: locale,
    identity: identity,
    options: JSON.stringify(options),
    json: true
  }

  console.log('loadProjectUnresolved:body: ' + JSON.stringify(body))
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
      return handleHabitatCloudResult(result)
    })
    .catch(err => {
      console.log('loadProjectUnresolved:error ' + err)
      return {ok: false, msg: 'cmd:loadProjectUnresolved:error: ' + err, project: project}
    })
}

const uploadProject = (url, {locale, project, projectData, options}) => {
  console.log('client requesting cloud update project: ' + projectData._id + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'uploadProject: ' + projectData._id,
    cmd: 'uploadProject',
    locale: locale,
    project: project,
    projectData: projectData,
    options: options,
    json: true
  }

  console.log('uploadProject:body: ' + JSON.stringify(body))
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
      const msg = 'uploadProject:error: ' + err.stack
      console.log(msg)
      return {ok: false, msg: msg}
    })
}

// we're implementing for a one-shot latestWins resolve here,
// but hopefully prepared with a command which could involve stages
// the semantics of the name are open for that

const loadProjectResolve = (url, {project, locale, identity,
  options = {resolveMode: 'latestWins'}}) => {
  console.log('load clouud project resolve: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url +', mode: ' + options.resolveMode )

  url += '/habitat-request'
  const body = {
    name: 'load cloud Project resolved: ' + assembleId(locale, project, identity),
    cmd: 'loadProjectResolve',
    project: project,
    locale: locale,
    identity: identity,
    options: options,
    json: true
  }

  console.log('loadProjectResolve:body: ' + JSON.stringify(body))
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
      return handleHabitatCloudResult(result)
    })
    .catch(err => {
      console.log('resolve conflicts:error ' + err)
      return {ok: false, msg: 'cmd:loadProjectResolve:error: ' + err, data: { no: 'data'}}
    })
}

const tryGql = (url, {query}) => {
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
      return {ok: false, msg: err}
    })
}

const publishProject = (url, {status, locale, project}) => {
  console.log('client requesting publish: ' + status
    + ' for ' + locale + ' - ' + project)

  url += '/habitat-request'
  const body = {
    name: 'set publish state: ' + +status +
      ' for ' + locale + ' - ' + project,
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
      console.log('publishProject:error ' + err)
      return {ok: false, msg: 'cmd:publishProject:error: ' + err}
    })
}

// note - due trepidation before doing this, as entire project will be _gone_,
// thus only an agent can do it, but you must also provide a stop and verify modal
const deleteProject = (url, {locale, project}) => {
  console.log('client requesting delete: ' + status
    + ' for ' + locale + ' - ' + project)

  url += '/habitat-request'
  const body = {
    name: 'delete project' + locale + ' - ' + project,
    cmd: 'deleteProject',
    publishStatus: status,
    locale: locale,
    project: project,
    json: true
  }

  console.log('deleteProject:body: ' + JSON.stringify(body))

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
          msg: 'deleteProject result: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'deleteProject result: ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('deleteProject:error ' + err)
      return {ok: false, msg: 'cmd:deleteProject:error: ' + err}
    })
}

// note - due trepidation before doing this, as entire locale will be _gone_,
// thus only an agent can do it, but you must also provide a stop and verify modal
// *todo* !! we are considering if only superAgent can do it,
const deleteLocale = (url, {locale, project}) => {
  console.log('client requesting delete: ' + status
    + ' for ' + locale + ' - ' + project)

  url += '/habitat-request'
  const body = {
    name: 'delete locale ' + locale,
    cmd: 'deleteLocale',
    publishStatus: status,
    locale: locale,
    json: true
  }

  console.log('deleteLocale:body: ' + JSON.stringify(body))

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
          msg: 'deleteLocale result: ' + ', (string) ' + result
        }
      } else {
        return {
          ok: result.ok,
          msg: 'deleteLocale result: ' + result.msg
        }
      }
    })
    .catch(err => {
      console.log('deleteLocale:error ' + err)
      return {ok: false, msg: 'cmd:deleteLocale:error: ' + err}
    })
}

const dbExists = (dbName) => {
  // *todo* convenience before the habitat-hd implementation
  return {ok: true, msg: dbName + ' isn\'t present', dbExists: false}
}

const initializeCloud = (url) => {

  console.log('client requesting cloud initialize: ' + url)
  const body = {
    name: 'initialize cloud', // *todo* sort out meanings and/or english for command
    cmd: 'initializeHabitat',
    json: true
  }

  return habitatRequest(url, body)
    .then(result => {  // fetch returns a Result object, must decode
      const type = result.headers.get('Content-Type')
      console.log('result content type: ' + type)
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
      console.log('result content type: ' + type)
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
      console.log('result content type: ' + type)
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
  return new Promise((resolve, reject) => {
    const db = createOrOpenDatabase(dbName, {skip_setup: true}) // don't attempt create
    getStatusFromDb(db)
      .then(result => {
        servicesLog('assureRemoteLogin:checkStatus: ' + JSON.stringify(result))
        console.log('logged in...')
        resolve({ok: true, msg: 'logged in to ' + dbName})
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
          reject({
            ok: false, msg: 'assureRemoteLogin:unexpected: '
              + dbName + ' status check error: ' + JSON.stringify(err)
          })
        } else {
          servicesLog('need to log in to ' + dbName + ', as rejected without identity')
          const dbPathOnly = dbName.split('/')
          const db = dbPathOnly.pop() // just the host, not the db
          const dbHost = dbPathOnly.join('/')
          loginViaModal(dbHost + '/sign_in')
            .then(result => {
              // console.log('assureRemoteLogin:logInViaModel result: ' + result + db)
              resolve({ok: true, msg: result + db})
            })
            .catch(err => {
              // console.log('assureRemoteLogin:logInViaModel error: ' + err)
              reject({ok: false, msg: err})
            })
        }
      })
  })
}

const assembleId = (locale, project, identity = '(identity)') => {
  return locale + ':' + project + ':' + identity
}

export {
  doRequest,
  assureRemoteLogin
}
