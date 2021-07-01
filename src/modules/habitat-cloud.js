// a statement of policy 09Jun 2021 is that all routines should return a standard
// object, with ok, potential msg, and data separately if that's provided. This should
// all occur in the cloud, and that will mean it's normally json coming here, if we
// sensibly keep the way open for simple text at least for now.

import nodeFetch from 'node-fetch'

import { loginViaModal, servicesLog, safeEnv } from './habitat-localservices';

const habitatCloud = safeEnv(process.env.HABITAT_CLOUD,
  'https://hd.narrationsd.com/hard-api')

const cloudName = safeEnv(process.env.CLOUD_NAME,
  'SFO Private Cloud')

const publicCloud = safeEnv(process.env.PUBLIC_CLOUD,
  'https://hd.narrationsd.com/hard-api/habitat-public')

// we're not actually entertaining string results anymore, but
// if we would in future, this should safety those and errors also
// as far as values. All life is a Promise, no?
function handleHabitatCloudResult (responseResult, msgPrefix = '') {

  const typedResult = (result) => {
    const type = result.headers.get('Content-Type')
    // console.log('handleHabitatCloudResult:result content type: ' + type)
    if (type.includes('application/json')) {
      return {type: 'json', data: result.json()}
    } else {
      return {type: 'text', data: result.text()}
    }
  }

  // the trick going on here is that in a fetch result,
  // which underlies nodeFetch and others we don't need
  // that promie much but actually can't deliver due to
  // the way browsers and the web actually operate,
  // the content of the Result object is still a Promise (!)
  // Thus we have to use all Promise-fu on it, after determining
  // what kind it is.

  // One more trarp for the unwary is that the content appears to
  // lock, once a Promise from it has been extracted. This means
  // that fishing around with console.log() to see what transpires
  // is going to get you in a lot of trouble. Hence this nested
  // routine.  It works, and we get everything back which might
  // have been sent, in convenient form, interpreted also so that
  // all the features of our cloud and client API works.

  const tResult = typedResult(responseResult) // just to make it clear
  return Promise.resolve(tResult.data)
    .then(result => {

      console.log('handleHabitatCloudResult:typed result: ' + JSON.stringify(result))

      if (tResult.type === 'json') {
        // we parse here, so the app doesn't have to
        // be careful: thrown errors in cloud won't have data returning
        const data = result.data
          ? JSON.parse(result.data) // unexpected errors caught in calling routine
          : {no: 'data'}

        const msg = msgPrefix +
          ((result.advice && result.advice.length > 0) ? result.advice : result.msg)

        // just combine what we have in, return the rest so we can add things later
        const interpreted = Object.assign(result, {
          data: data,
          msg: msg
        })

        // testing only; too much to log on real data
        console.log('interpreted: ' + JSON.stringify(interpreted))
        return interpreted
      } else {
        return {
          ok: true,
          data: {no: 'data'},
          advice: null,
          identity: null,
          roles: null,
          possibleRoles: null,
          msg: msgPrefix + result
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
    case 'loadProject':
      result = loadProject(habitatCloud, args)
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

const createLocale = (url, {locale, identity}) => {
  console.log('client requesting cloud create locale: ' + identity + ', url: ' + url)

  url += '/habitat-request'
  const body = {
    name: 'create locale: ' + locale, // *todo* sort out meanings and/or english for command
    cmd: 'createLocale',
    identity: identity,
    locale: locale,
    json: true
  }

  // *todo* preliminaries only so far
  return habitatRequest(url, body)
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
  return habitatRequest(url, body)
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
  return habitatRequest(url, body)
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

  // before anything, a safety, especially for developers
  // let's see at least the basis of a fully formed project
  // *todo* there could be more sanity checking here if they need it
  if(!projectData.details
    || !projectData.details.locale
    || !projectData.details.name
    || !projectData.hdFrame
    || !projectData.hdObject) {
    throw new Error ('Fully formed Hardocs Project not present yet to update from! ' +
      'See what\'s missing: ' + JSON.stringify(projectData))
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

  return habitatRequest(url, body)
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

const loadProject = (url, {project, locale, identity,
  options = {resolveMode: 'latestWins'}}) => {
  console.log('load clouud project resolve: ' + project + ', locale: ' + identity +
    ', identity: ' + identity + ', url: ' + url +', mode: ' + options.resolveMode )

  url += '/habitat-request'
  const body = {
    name: 'load cloud Project resolved: ' + assembleId(locale, project, identity),
    cmd: 'loadProject',
    project: project,
    locale: locale,
    identity: identity,
    options: options,
    json: true
  }

  console.log('loadProject:body: ' + JSON.stringify(body))
  return habitatRequest(url, body)
    .then(result => {
      console.log ('loadProject":firstresult: ' + JSON.stringify(result))
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
  return habitatRequest(url, body)
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

  return habitatRequest(url, body)
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

  return habitatRequest(url, body)
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

  return habitatRequest(url, body)
    .then(result => {
      return handleHabitatCloudResult(result, 'deleteProject: ')
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

  return habitatRequest(url, body)
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
      return handleHabitatCloudResult(result, 'initializeCloud: ')
    })
}

const getLoginIdentity = (url) => {

  const body = {
    name: 'get login identity', // *todo* sort out meanings and/or english for command
    cmd: 'getLoginIdentity',
    json: true
  }

  return habitatRequest(url, body)
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

// *todo* we might yet fold this into doRequest? as prefixing that is only use now
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

  return await new Promise((resolve, reject) => {
    getLoginIdentity(habitatCloud)
      .then(result => {
        console.log('logged in...' + result.msg)
        resolve({
          ok: true,
          msg: 'logged in to ' + cloudName,
          data: result})
      })
      .catch(err => {

        console.log ('assureRemoteLogin:err: ' + err)
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
          // rearrange so we're talking to the proxy directly
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

// be sure to understand this is not definitive - is just for labels,
// if we do it that way. Real identity and thus ids are always resolved
// only with the secured identity in the cloud. No forgery.
const assembleId = (locale, project, identity = '(identity)') => {
  return locale + ':' + project + ':' + identity
}


export {
  doRequest,
  assureRemoteLogin
}
