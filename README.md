---
---

# Habitat Client API - beginning to update this 01 Jul 2021

## Status

This is the client-side API for Habitat, the local and cloud services package for Hardocs. 

Please be sure to read the Security and Usage sections below carefully, before use.

## Usage

At present, we're in Beta phase, so the following will keep you aligned.

1. As usual, you would begin work with a release by updating your own project. As applications are using yarn, that's by: `yarn install`.


2. After install, you must also run the following, to actually get the Beta version, which is far advanced beyond any original from last year:  `yarn upgrade @hardocs-project/habitat-client@beta`. This will pull the beta version, and update your packages.json version in the usual way for it.


3. From then onwards, you're able to do a general `yarn upgrade` at points you want to, to update any other packages in your project.


4. The tricky thing is that `yarn upgrade` will ***not*** upgrade beta-tagged versions. It will stick on the beta version you first installed, even when the Beta is updated.


5. So to pick up any later Beta version, always follow your general upgrade with the same: `yarn upgrade @hardocs-project/habitat-client@beta` as you used when originally installing it. Now you will be updated to the Beta client package as well.

## Security Concerns

At present, this npm package still includes habitatDatabase and support modules, but these will be going away shortly, as soon as the App Framework manages its internals in another way.

N.B. There MUST always be NO USE OF LOCAL DATABASE in any Hardocs apps, packages, or other code. 

It would be a security hazard for data loss, non-recoverabilty, and of top concern, forgery. So if you did something like this, except for the App Framework project, please be certain to remove it now.

As well, there would be no way to back up workstations dependably for Hardocs content.  This would not be a satisfactory situation at all, but security just mentions precludes us completely from considering it.

## Developing and Publishing

It's not presumed that app developers will write in any of this package, except possibly by a pull request. For that special case, there's ability to work only locally.

You'd use `yarn link` in the package project, and then follow the instructions that gives you in your application project. From that time forward, your application will build with your local client package code instead of using anything from the npm repository.

This is undoable, but you can look that up. Using yarn for linking is far preferable to the npm version, which is tricky indeed.

To update the local package for the link, use `yarn dev` (not npm) to run the script provided. Instantly your app will use the new package.

### Actually Publishing

This is not something normally to be involved with, for the project, and additionally you would need to know accurately what you are doing to succeed and avoid ruining the repository situation for other projects using the package, in one of its tagged forms.

Should you be tasked to do this by the Hardocs Project owner, there are several publishing scripts, providing for specific repository tag status that will determine who sees updates. Again, not unless you're tasked and permitted this on the npm repository, and not unless you fully understand consequences and what you are doing -- you can seee the protections are essential.    

F
