// expose the habitat database modules for npm

import {
  storeToDatabase,
  loadFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listOwnerProjects,
  replicateDatabase,
  assureRemoteLogin
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

const habitatDb = {
  storeToDatabase,
  loadFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listOwnerProjects,
  replicateDatabase,
  assureRemoteLogin
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

export { habitatDb, habitatLocal }
