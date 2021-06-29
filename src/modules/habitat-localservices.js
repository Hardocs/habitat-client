// localservices are intended to be the variety needed of calls to access
// local abilities through Electro nor Hardocs, like files in various direct or by dialog
// ways, but later also any further items if needed, such as app dialogs and windows.
// These last are not implemented yet, but will be according to need.

// You should always access local services through this Habitat interface module.
// The wisdom of Habitat managing them was already shown in the accommodation effort for
// the recent version change of Electron. Its filesystem access is one of the portions
// that is most unstable across releases, and recent plans show this is going to become
// much more serious in the near future.

// We'll take care of it here, when it's time, and Hardocs apps will then
// need no changes, remain stable as you've written them.

// n.b. note the simple pathed file calls are last; calls with selection dialogs come first

import fs from 'fs'
import path from 'path'
import electron from 'electron'
import {spawn} from 'child_process'

const { dialog, getCurrentWindow, BrowserWindow, app } = electron.remote
const rendWin = getCurrentWindow()

// n.b. throughout these api calls, the practice of having our own Promise wrap
// enables us to unify the api even when internal calls may not be promises,
// for results and errors always to appear and be handled the same.
//
// Doing so also allows us to insert identity for example into error messages,
// so that the application can know and present exactly where any problems or
// intentionally canceled operations may have occurred.

// selectContentFromFile handles everything where you want a chooser to come
// up allowing to select a given file -- and return its content.
//
// There are the other calls below for separately choosing a directory, and then
// for loading a set of filenames from it, or for loading content of an individual file.

const selectContentFromFolder = (
  fileExts = ['*'],
  typeName = 'Any Files',
  options = 'utf8'
) => {
  return new Promise((resolve, reject) => {
    if (process.env.ORIGINAL_XDG_CURRENT_DESKTOP !== null) {
      dialog.showOpenDialog(rendWin, {
        filters: [
          {name: typeName, extensions: fileExts}
        ],
        properties: [
          'openFile',
        ]
      })
      .then(fileInfo => {
        if (!fileInfo.canceled) {
          // only a single file is chosen -- use the other accesses below to get many
          const filePath = fileInfo.filePaths[0]
          return filePath
        } else {
          reject('(Cancelled...)')
        }
      })
      .then (filePath => {
        loadContentFromFilePath(filePath, options)
        .then(contentInfo => {
          resolve(contentInfo)
        })
      })
      .catch(e => {
        reject('selectContentFromFolder: ' + e.toString())
      })
    } else {
      reject('SelectContentFromFile:error: Not allowed.')
    }
  })
}

const loadContentFromFilePath = (filePath, options = 'utf8') => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, options,
      (err, data) => {
        if (err) {
          reject('loadContentFromFilePath' + err)
        } else {
          resolve({filePath: filePath, content: data})
        }
      })
  })
}

// chooseFolderForUse() is factored here as one can want to do this
// independently of actually gathering files, for example, for a time of
// opening a chooser as this does, and simply identifying a folder. You don't actually
// use any arguments in that case, just call (as Promise) chooseFolderForUse() alone.
//
// We provide other api calls for more complete operations, such as getting
// all files of type/s for a chooser-identified folder, for example, such as
// selectContentFromFolder() just above.  Such calls use the arguments.
//
// In the Electron implementation itself, typesNames isn't actually
// used at present, but we're prepared for when it may be.

const chooseFolderForUse = (typesName = 'Choose a Folder',
                            properties = [ 'openDirectory']) => {

  // as other calls, this is a Promise, so you use via .then and .catch as always
  return new Promise ((resolve, reject) => {
    dialog.showOpenDialog(rendWin, {
        filters: [
          { name: typesName, extensions: ['*'] }
        ],
        properties: properties
      })
      .then(fileInfo => {
        if (!fileInfo.canceled) {
          // the folder is always the first of the filePaths
          const folderPath = fileInfo.filePaths[0]
          resolve (folderPath)
        } else {
          reject('(Cancelled...)')
        }
      })
      .catch(err => {
        reject('chooseFolderForUse: ' + err.toString())
      })
  })
}

// Now, why do we have this call, loadFilePathsFromFolder, especially? It's a
// clear choice when you already know the directory, because then you also will
// not then have a chooser narrowing down which files are appropriate.
//
// So we provide that selectivity, this time for potentially multiple files,
// via a regular expression matcher. Thus you can ask for multiple file types,
// as in the default, by separating the extensions with a | symbol.
// Be aware that as it's an RE, no spaces are needed or allowed!

const loadFilePathsFromFolder = (folderPath, fileExts = ['html', 'htm']) => {
  return new Promise((resolve, reject) => {
    servicesLog('loadFilePathsFromFolder: ' + JSON.stringify(folderPath))
    try {
      const files = fs.readdirSync(folderPath)
      const filesRE = fileExts.reduce ((accumulator, currentValue) => {
        return accumulator += '|' + currentValue
      })
      const extsMatch = new RegExp(filesRE, "g")

      let extFiles = []
      files.forEach(file => {
        if (path.extname(file).match(extsMatch)) {
          extFiles.push(folderPath + '\\' + file)
        }
      })
      resolve({ folderPath: folderPath, files: extFiles })
    } catch (e) {
      console.log(JSON.stringify({ loadFilePathsFromFolder: 'error: ' + e.toString() }))
      reject({ loadFilePathsFromFolder: 'error: ' + e.toString() })
    }
  })
}

// Here's another variation you'll need -- when you want to get _all_
// the files back from a folder you choose, to make a list of them.
//
// The same abilities and rules apply for fileExts as in loadFilePathsFromFolder,
// as we use that here.
const loadFilePathsFromSelectedFolder = (fileExts = ['html', 'htm']) => {
  return new Promise((resolve, reject) => {
    if (process.env.ORIGINAL_XDG_CURRENT_DESKTOP !== null) {
      chooseFolderForUse() // using the default, openDirectory
      .then(folderPath => {
        if (folderPath !== null /* || !folder.canceled*/) {
          // const folderPath = folder.filePaths[0]
          servicesLog('loadFilePathsFromSelectedFolder: ' + JSON.stringify(folderPath))
          loadFilePathsFromFolder(folderPath, fileExts)
            .then (result => {
              resolve(result)
            })
            .catch(e => {
              reject('loadFilePathsFromSelectedFolder:error: ' + JSON.stringify(e))
            })
        } else {
          reject({loadFilePathsFromSelectedFolder: '(Cancelled...)'})
        }
      })
        .catch(err => {
          reject ('loadFilePathsFromSelectedFolder:error: ' + JSON.stringify(err))
        })

    } else {
      reject('loadFilePathsFromSelectedFolder:error: Not allowed')
    }
  })
}

const putContentToSelectedFolder = (content,
                            proposedFilename = 'edited',
                            fileExt = 'html',
                            fileDescription = 'Html Files') => {
  return new Promise((resolve, reject) => {
    if (process.env.ORIGINAL_XDG_CURRENT_DESKTOP !== null) {
      dialog.showSaveDialog(rendWin, {
          defaultPath: proposedFilename,
          message: 'Save your file here: ',
          properties: [
            'createDirectory ',
            'showOverwriteConfirmation ',
          ],
          filters: [
            {name: fileDescription, extensions: [fileExt]}
          ],
        })
        .then(file => {
          if (!file.canceled) {
            const accomplished = fs.writeFileSync(file.filePath, content, {
              encoding: 'utf8',
            });
            resolve({path: file.filePath, success: accomplished})
          } else {
            reject({path: '(Cancelled...)', content: ''})
          }
        })
        .catch(e => {
          reject('putContentToSelectedFolder: ' + e.toString())
        })

    } else {
      reject('putHtmlToFile:error: Not allowed.')
    }
  })
}

const putContentToFilePath = (filePath, content) => {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFileSync(filePath, content, 'utf8')
      resolve({ok: true})
    } catch (e) {
      reject('putContentToFilePath: ' + e.toString())
    }
  })
}

const shellProcess = (childPath, args = [], options = {}) => {

  return new Promise((resolve, reject) => {
    let shellErrs = ''

    try {
      let shellChild = spawn(childPath, args, options)
      // note that we could have own options, if we want own control
      options = Object.assign(options, {
          // things we control from and for here
          stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        },
      )
      shellChild.on('message', (ret) => {
        console.log('shellChild message: ' + ret)
      })
      shellChild.stdout.on('data', (ret) => {
        servicesLog('shellChild stdout: ' + ret)
      })
      shellChild.stderr.on('data', (ret) => {
        shellErrs += ret
      })

      // *todo* still in discovery here, if it all does work well.
      // Appears a while that the close event may not reliable if there are errors.
      // However, it looks now that this was just a dev hot updates problem.
      // The next step is then buffering up stderr and stdout, deciding in the end
      // to reject also if stderr, as Pandoc prints useful warnings. Or resolve with them?
      shellChild.on('close', ret => {
        // console.log ('shellChild close: ' + ret)
        if (ret === 0) {
          let status = {} // let's try doing this as couchDB does
          if (shellErrs.length > 0) {
            servicesLog('shellChild succeeded with issues: ' + shellErrs)
            status = { ok: false, status: shellErrs }
          } else {
            status = { ok: true }
          }
          resolve(status)
        } else {
          reject('failed: ' + shellErrs)
        }
      })
    } catch (e) {
      reject('shellProcess: ' + e.toString())
    }
  })
}

// the two ops on Node cookies should not be exported for safety; so we have
// a single call to log off, which is the thing they're used for other than development
// we might additionaly have also a cloud cmd, but always this for assurancee

const logoutOfHabitat = (domain = 'hd.narrationsd.com') => {

  return getNodeCookies()
    .then(/*result*/ () => {
      // commented-out possible cookies log left in for dev.
      // console.log('cookies: ' + JSON.stringify(result))
      // return result
    })
    .then(() => {
      // as long as this cookie name doesn't change from Habitat proxy, this does it
      deleteNodeCookies(
        [{ name: '_oauth2_proxy', domain: domain }])
      return { ok: true, msg: 'Logged off ' + domain + '...'}
    })
    .catch(err => {
      return { ok: false, msg: 'logOffHabitat: ' + err}
    })
}

const getNodeCookies = (filter = {}) => {
  const nodeSession = rendWin.webContents.session
  return nodeSession.cookies.get(filter)
}

const deleteNodeCookies = (cookies) => {
  const nodeSession = rendWin.webContents.session
  const sessionCookies = nodeSession.cookies

  cookies.forEach(cookie => {
    let domain  = cookie.domain
    if (domain[0] === '.') {
      domain = domain.substr(1)
    }
    const url = 'https://' + domain
    console.log ('cookies.name: ' +  cookie.name + ',  url: ' + url + ',  c-url: ' + cookie.url + ', domain: ' + cookie.domain)

    sessionCookies.remove(url, cookie.name)
      .then (result => {
        console.log ('result: ' + result + ', removed ' + url + ', ' + cookie.name)
      })
      .catch(e => {
        console.log('cookie-del:err: ' + e)
      })
  })
}

const getRendererCookies = () => {

}

const modalOnFileHtml = async (fileName, options = {}) => {
  return new Promise ((resolve, reject) => {
    console.log ('modal options: ' + JSON.stringify(options))
    options = Object.assign(options, {
      parent: rendWin,
      modal: true,
      show: false,
      autoHideMenuBar : true
    })
    const child = new BrowserWindow(options)
    const fileUrl = `file://${__static}\\` + fileName
    child.loadURL(fileUrl, options)
      .then (() => {
        // child.once('ready-to-show', () => {
          // let's not show it  ourselves - in some scenario, might receive an event first
          // child.show()
          resolve(child)
        // })
      })
      .catch (err => {
        reject (err)
      })
    })
}

const loginViaModal = async (url,
                        loggedInMatch = 'https://hd.narrationsd.com/',
                        options = {userAgent: 'Chrome'}) => {
  return new Promise ((resolve, reject) => {
    options = Object.assign(options, { parent: rendWin, modal: true, show: false })
    const child = new BrowserWindow(options)
    // a little intricate with the events here, but how it can work
    let loggedOn = false
// url = 'x' + url
    child.loadURL(url, options)
      .then (() => {
          child.webContents.on('did-redirect-navigation', (e, url) => {
            if (url === loggedInMatch
              || url === loggedInMatch + '#') { // means we got through identity proxy
              loggedOn = true // watch the order here - close event from child.close() checks it
              child.close()
              const msg = 'logged in to ' + loggedInMatch
              // console.log('loginViaModal: ' + msg)
              resolve(msg)
            }
          })
          child.webContents.on('close', (e) => {
            // a flag is archaic, but better than try/catch needed on getURL otherwise,
            // and we know the url anyway. Protecting from loggedOn state, as we'll be
            // already resolving.
            if (!loggedOn) {
              const msg = 'Not logged in, as dialog was closed.'
              console.log('loginViaModal: ' + msg)
              reject ({ ok: false, msg: msg })
            } else {
              resolve (child)
            }
          })
          child.show()
      })
      .catch (err => {
        reject ({ ok: false, msg: 'Authenticate login failed: ' + err })
      })
  })
}


// utility to keep troubleshooting ability, but get many commented
// console.log()s out of the codebase. It offers a force argument,
// for enabling individual log points
let servicesLogging = true // *todo* for now - later false thus optional

const doLogging = (enable) => {
  console.log ('services logging: ' + JSON.stringify(enable))
  servicesLogging = enable
}

const servicesLog = (msg, force = false) => {
  if (servicesLogging || force) {
    console.log('services: ' + msg)
  }
}

export {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  modalOnFileHtml,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess,
  loginViaModal,
  logoutOfHabitat,
  servicesLog,
  doLogging
}
