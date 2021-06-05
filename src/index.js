// expose the habitat database modules for npm

import {
  readLocalProjectObject,
  createOrOpenDatabase,
  getStatusOfDb,
  listLocaleProjects,
  loadHabitatObject,
  storeHardocsObject,
  saveObjectNoEdit,
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
  loadHabitatObject,
  saveProjectObject,
  saveObjectNoEdit,
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
