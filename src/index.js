// expose the habitat database modules for npm

import {
  getStatusOfDb,
  listLocaleProjects,
  loadHardocsObject,
  storeHardocsObject,
  replicateDatabase,
  clearDatabase,
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
  getStatusOfDb,
  listLocaleProjects,
  storeHardocsObject,
  loadHardocsObject,
  replicateDatabase,
  clearDatabase,
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
