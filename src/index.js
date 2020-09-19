// expose the habitat database modules for npm

import {
  storeToDatabase,
  loadFromDatabase,
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
} from './modules/habitat-localservices'

const habitatDb = {
  storeToDatabase,
  loadFromDatabase,
  clearDatabase
}

const habitatServices = {
  selectContentFromFolder,
  loadContentFromFilePath,
  chooseFolderForUse,
  loadFilePathsFromFolder,
  loadFilePathsFromSelectedFolder,
  putContentToSelectedFolder,
  putContentToFilePath,
  shellProcess
}

export { habitatDb, habitatServices }
