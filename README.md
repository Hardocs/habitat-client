---
---

# Habitat Client API

This is the client-side API for accessing 

# Development

- to develop, only once use `yarn link` to prepare the local cache label.

- to connect to the result, in your app, only once use  `yarn link @hardocs-project/habitat-client`, to install the connection bypassing package.json

- then for every update, do `yarn dev` to build the lib, which will automatically update for your app - and recompile/restart it if you are running in an auto-update command such as electron:serve etc.
