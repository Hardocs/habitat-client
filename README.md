---
---

# Habitat Client API - beginning to update this 09 Jun 2021

## Status

This is the client-side API for Habitat, the local and cloud services package for Hardocs.

## Publishing

N.b. there are several publishing codes, providing for alpha and beta versions, as well as purely dev processing to work with `yarn link` in convenient development.  But watch out...npm is required for any of the publishing steps.  For example:

- `yarn dev` - rebuilds the lib, so that a linked project will see it
- `npm run apub` - but this is the only way to update the npm repository


There are two primary versions active at present:

### branch `master`

This is recently set to version 6.0.0, stable and in use for various ongoing Hardocs client work. It's published and present on the npm repository, via `@hardocs-project/habitat-client@latest`.

### branch `feature/clear-protocol`.

This is the developmental version, recently set to separated version range from 7.0.0, which has added and revised features enabled to support the emerging Hardocs cloud services. These include the developed pattern which matches a local Hardocs object to its cloud version, enabling replication.

It can be used at present only in the Hardocs Framework Application, which demonstrates these cloud-orientated facilities as currently operational, and engages their completing development.

For use appropriate in that way, and for the future, it's published also on npm, via `@hardocs-project/habitat-client@alpha`

## Development

Using the following procedure provides a dependable and stable ability to substitute a local clone of the habitat-client instead of the current npm repository content, enabling development.

Note that the npm seeming equivalent is actually quite troublesome, so this is one area where yarn has proven a useful ability.

Another useful side of that coin would be to recognize that yarn raises problems npm does not, when changing branches of a development, where a clean, deleted yarn.lock with full re-install on the fresh package.json is required as apparently the simplest way to make a working transition.

Knowing both of these, we've then had good ways to work together in our team, as features emerge and develop.

### how to do it

Here's the yarn procedure and results for linking, which have been giving us the nice way to have fully local development of package abilities:

- to develop, only once use `yarn link` to prepare the local cache label.

- to connect to the result, in your app, only once use  `yarn link @hardocs-project/habitat-client`, to install the connection bypassing package.json

- then for every update, do `yarn dev` to build the lib, which will automatically update for your app - and recompile/restart it if you are running in an auto-update command such as electron:serve etc.
