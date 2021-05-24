// expose the habitat database modules for npm

import {
  readLocalProjectObject,
  createOrOpenDatabase,
  getStatusOfDb,
  listLocaleProjects,
  loadHardocsObject,
  storeHardocsObject,
  saveHabitatObject,
  saveProjectObject,
  updateProjectObject,
  replicateDatabase,
  clearDatabase
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
  readLocalProjectObject,
  createOrOpenDatabase,
  getStatusOfDb,
  listLocaleProjects,
  storeHardocsObject,
  loadHardocsObject,
  saveProjectObject,
  saveHabitatObject,
  updateProjectObject,
  replicateDatabase,
  clearDatabase
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
