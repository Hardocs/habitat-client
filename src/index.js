// expose the habitat database modules for npm

import {
  storeToDatabase,
  loadFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listOwnerProjects
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
  showModalPage,
  getNodeCookies,
  deleteNodeCookies
} from './modules/habitat-localservices'

const habitatDb = {
  storeToDatabase,
  loadFromDatabase,
  clearDatabase,
  getStatusOfDb,
  listOwnerProjects,
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
  showModalPage,
  getNodeCookies,
  deleteNodeCookies
}

export { habitatDb, habitatLocal }
