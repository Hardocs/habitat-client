// expose the habitat database modules for npm

import {
  createOrOpenDatabase,
  getStatusOfDb,
  listLocaleProjects,
  loadProjectObject,
  storeProjectObjectSameRev,
  storeProjectObject,
  updateProjectObject,
  replicateFromToDatabase,
  clearDatabase
} from './modules/habitat-database'

import {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  modalOnFileHtml,
  progressModalFactory,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess,
  logoutOfHabitat
} from './modules/habitat-localservices'

import {
  assureRemoteLogin,
  doRequest
} from './modules/habitat-cloud'

const habitatDb = {
  createOrOpenDatabase,
  getStatusOfDb,
  listLocaleProjects,
  loadProjectObject,
  storeProjectObject,
  storeProjectObjectSameRev,
  updateProjectObject,
  replicateFromToDatabase,
  clearDatabase
}

const habitatLocal = {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  modalOnFileHtml,
  progressModalFactory,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess,
  logoutOfHabitat
}

const habitatCloud = {
  doRequest,
  assureRemoteLogin
}

export { habitatCloud, habitatDb, habitatLocal }
