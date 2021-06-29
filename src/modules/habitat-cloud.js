// a statement of policy 09Jun 2021 is that all routines should return a standard
// object, with ok, potential msg, and data separately if that's provided. This should
// all occur in the cloud, and that will mean it's normally json coming here, if we
// sensibly keep the way open for simple text at least for now.

import nodeFetch from 'node-fetch'

import { safeEnv } from './transport-ifc';
import { loginViaModal, servicesLog, getNodeCookies } from './habitat-localservices';

const habitatCloud = safeEnv(process.env.HABITAT_CLOUD,
  'https://hd.narrationsd.com/hard-api')

const publicCloud = safeEnv(process.env.PUBLIC_CLOUD,
  'https://hd.narrationsd.com/hard-api/habitat-public')

// *todo* we might yet fold this into doRequest? as prefixing that is only use now
// see that our connection is alive and pathed
const assureCloudConnection = (url) => {
  return nodeFetch (url)
    .then (checkFetchStatus)
    .then (result => {
      console.log('assureCloudConnection:json: ' + result.json())
      return JSON.stringify(result.json)
    })
    .then (body => { return body })
    .catch (err => {
      console.log ('checkFetchStatus:FetchError?: ' + err)
      return 'error: ' + err.stack
    })
}

// *todo* used now only in assureCloudConnection, so goes out also
const checkFetchStatus = (res) => {
  if (res.ok) { // res.status >= 200 && res.status < 300
    return res
  } else {
    const msg = 'Habitat cloud not responding as expected: ' + res.statusText
    console.log('checkFetchStatus:err: ' + msg)
    throw new Error(msg)
  }
}

// we're not actually entertaining string results anymore, but
// if we would in future, this safeties those and errors also
// as far as values, all life is a Promise, no?
function handleHabitatCloudResult (promiseResult, msgPrefix = '') {

  const typedResult = (result) => {
    if (result.config) {
      // it's Axios, just strip of the message
      return result.data
    }
    const type = result.headers.get('Content-Type')
    // console.log('handleHabitatCloudResult:result content type: ' + type)
    if (type.includes('text/plain')) {
      return result.text()
    } else {
      return result.json()
    }
  }

  return Promise.resolve(typedResult(promiseResult))
    .then (result => {

      // console.log ('handleHabitatCloudResult:typed from promises result is: ' + JSON.stringify(result))

      if (typeof result !== 'object') {
        console.log('handleHabitatCloudResult:string result')
        return {
          ok: true,
          data: {no: 'data'},
          advice: null,
          identity: null,
          msg: msgPrefix + result
        }
      } else {
        // console.log('handleHabitatCloudResult:json object result: ' + JSON.stringify(result))
        // we parse here, so the app doesn't have to
        // be careful: thrown errors in cloud won't have data returning
        let data = result.data
          ? JSON.parse(result.data) // unexpected errors caught in calling routine
          : { no: 'data'}

        return {
          ok: result.ok,
          data: data,
          identity: result.identity,
          msg: msgPrefix +
            ((result.advice && result.advice.length > 0) ? result.advice : result.msg)
        }
      }
    })
}

const doRequest = (command = 'getLoginIdentity', args = {}) => {
  console.log('habitat-cloud:doRequest: <' + command)
    // + ', args: ' + JSON.stringify(args) + '>')

  let result = {}

  // this is kept for flexibility, though many commands simplify just to use { arguments }
  switch (command) {
    case 'getLoginIdentity':
      result = getLoginIdentity(habitatCloud)
      break
    case 'checkRoles':
      result = checkRoles(habitatCloud)
      break
    case 'createLocale':
      result = createLocale(habitatCloud, args)
      break
    case 'deleteLocale':
      result = deleteLocale(habitatCloud, args)
      break
    case 'createProject':
      result = createProject(habitatCloud, args)
      break
    case 'deleteProject':
      result = deleteProject(habitatCloud, args)
      break
    case 'loadProjectUnresolved':
      result = loadProjectUnresolved(habitatCloud, args)
      break
    case 'loadProjectResolve':
      result = loadProjectResolve(habitatCloud, args)
      break
    case 'updateProject':
      result = updateProject(habitatCloud, args)
      break
    case 'dbExists':
      // *todo* isn't this decode a leftover; do without?
      result = dbExists(decodeURIComponent(habitatCloud))
      break
    case 'initializeCloud':
      result = initializeCloud(habitatCloud)
      break
    case 'listProjects':
      result = listProjects(habitatCloud, args)
      break
    case 'tryGql':
      result = tryGql(habitatCloud, args)
      break
    case 'publishProject':
      result = publishProject(habitatCloud, args)
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
// More critical yet, is to use PouchDb's _browser_ nodeFetch() -- which leads to
// un-named _native_, potentially the actual browser's, or something they made.
// There is no other nodeFetch() of many kinds tried that will work, and I am
// surprised that this one does, as it manages to make a call on the web
// which allows the browser's cookies through. That fact is crucial, as it is
// again by experiment, the only way that the _oauth2_proxy cookie will be
// returned to it, in turn the only way our highly recommended security proxy
// will allow anything through.
//
// So, it works. What if it doesn't in some future time?  This is unlikely, as
// this particular nodeFetch() of theirs is central and crucial to PouchDb's ability
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
  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      return handleHabitatCloudResult(result, 'createLocale result: ')
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
  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      return handleHabitatCloudResult(result, 'createProject result: ')
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
  return nodeFetch(url, {
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
    .then (handled => {
      if (!handled.ok) {
        console.log ('handled.ok false!!')
        // ok: false means a real error here, is not informational
        throw new Error (handled.msg)  // then this makes a simpler api pattern
      }
      return handled
    })
    // we don't catch, so that throws are caught  directly in api
}

const updateProject = (url,
        { locale, project, projectData, options, progressMonitor}) => {
  console.log('client requesting cloud update project: ' +
    projectData._id + ', url: ' + url)
  // console.log ('updateProject:projectData:' + JSON.stringify(projectData.details.locale))
  // console.log ('updateProject:projectData:' + JSON.stringify(projectData.hdFrame))
  // console.log ('updateProject:projectData:' + JSON.stringify(projectData.hdObject))
  // before anything, a safety, especially for developers
  // let's see at least the basis of a fully formed project
  if(!projectData.details || !projectData.hdFrame || !projectData.hdObject) {
    throw new Error ('Fully formed Hardocs Project not present yet to update from!')
  }

  url += '/habitat-request'
  const body = {
    name: 'updateProject: ' + projectData._id,
    cmd: 'updateProject',
    locale: locale,
    project: project,
    projectData: projectData,
    options: options,
    json: true
  }

  if (progressMonitor) {
    progressMonitor(50)
  }

  // console.log('updateProject:body: ' + JSON.stringify(body))

  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      console.log ('fetch result: ' + JSON.stringify(result.data))
      return handleHabitatCloudResult(result)
    })
    .then(handled => {
      if (!handled.ok) {
        // ok: false means a real error here, is not informational
        throw new Error(handled.msg)  // then this makes a simpler api pattern
      }
      return {
        ok: handled.ok,
        msg: handled.msg
      }
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
  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      console.log ('loadProjectResolve":firstresult: ' + JSON.stringify(result))
      return handleHabitatCloudResult(result)
    })
    .then (handled => {
      // console.log ('handled: ' + JSON.stringify(handled))
      if (!handled.ok) {
        console.log ('handled.ok false!!')
        // ok: false means a real error here, is not informational
        throw new Error (handled.msg)  // then this makes a simpler api pattern
      }
      return handled
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
  return nodeFetch(url, {
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
    .then (handled => {
      console.log ('handled: ' + JSON.stringify(handled))
      if (!handled.ok) {
        console.log ('handled.ok false!!')
        // ok: false means a real error here, is not informational
        throw new Error (handled.msg)  // then this makes a simpler api pattern
      }
      return handled
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

  return nodeFetch(url, {
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
}

const listProjects = (url, {locale = 'all', project = 'all'}) => {
  console.log('client requesting list projects: ' + ' for locale: ' +
    locale + ', project: ' + project)

  url += '/habitat-request'
  const body = {
    name: 'list projects locale: ' + locale + ', project: ' + project,
    cmd: 'listProjects',
    publishStatus: status,
    locale: locale,
    project: project,
    json: true
  }

  console.log('listProjects:body: ' + JSON.stringify(body))

  return nodeFetch(url, {
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
      console.log('listProjects:error ' + err)
      return {ok: false, msg: 'cmd:listProjects:error: ' + err}
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

  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      return handleHabitatCloudResult(result, 'deleteProject result: ')
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

  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(result => {
      return handleHabitatCloudResult(result, 'deleteLocale result: ')
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
      return handleHabitatCloudResult(result, 'deleteProject result: ')
    })
}

const getLoginIdentity = (url) => {

  const body = {
    name: 'get login identity', // *todo* sort out meanings and/or english for command
    cmd: 'getLoginIdentity',
    json: true
  }
  console.log('client requesting login identity: ' + url + ', body: ' + JSON.stringify(body))

  // *todo* what's been done here needs to refactor into habitatRequest itself,
  // *todo* tbd soon, and will eliminate much discovery boilerplate through this file
  // *todo* experiments with url path here shows cloud should give a response with
  // *todo* CORS if that's possible, if a bad path appears. This may well be an
  // *todo* nginx config rather than a change within the cloud, though the
  // *todo* cloud may possibly provide the response given a rewritten call for this
  return habitatRequest(url/* +'x'*/, body)
    // .then(checkFetchStatus)
    .then(result => {  // fetch returns a Result object, must decode
      return handleHabitatCloudResult(result, 'getLoginIdentity result: ')
    })
}

// *todo* this goes out, almost assured, as all role-playing is on cloud after discovery
const checkRoles = (url) => {

  const body = {
    name: 'check roles', // *todo* sort out meanings and/or english for command
    cmd: 'checkRoles',
    json: true
  }
  console.log('client requesting roles: ' + url + ', body: ' + JSON.stringify(body))

  return habitatRequest(url, body)
    .then(result => {  // fetch returns a Result object, must decode
      return handleHabitatCloudResult(result, 'checkRoles result: ')
    })
}

function habitatRequest (url, body) {

  url += '/habitat-request'

  return nodeFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include', // how critical? Very. Enables oauth. Don't leave home without it
    headers: new Headers({
      'Content-Type': 'application/json', // 'text/plain'
    }),
  });
}

const assureRemoteLogin = async (dbName = publicCloud) =>  {

  // this is rather tricky below, as it also handles for login

  return new Promise((resolve, reject) => {
    getLoginIdentity('https://hd.narrationsd.com/hard-api')
      .then(result => {
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
              console.log('assureRemoteLogin:logInViaModel result: ' + result + db)
              resolve({ok: true, msg: result + db})
            })
            .catch(err => {
              console.log('assureRemoteLogin:logInViaModel error: ' + JSON.stringify(err))
              reject(err)
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
