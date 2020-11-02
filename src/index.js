// expose the habitat database modules for npm

import {
  storeProjectToDatabase,
  loadProjectFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listLocationProjects,
  replicateDatabase,
  saveHardocsObject
} from './modules/habitat-database'

import {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess,
  getNodeCookies,
  deleteNodeCookies
} from './modules/habitat-localservices'

import {
  assureRemoteLogin,
  doRequest
} from './modules/habitat-cloud'

const habitatDb = {
  storeProjectToDatabase,
  loadProjectFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listLocationProjects,
  replicateDatabase,
  saveHardocsObject,
  assureRemoteLogin,
  doRequest
}

const habitatLocal = {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess,
  getNodeCookies,
  deleteNodeCookies
}

const habitatCloud = {
  doRequest,
  assureRemoteLogin
}

export { habitatCloud, habitatDb, habitatLocal }
