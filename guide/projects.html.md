---
layout: ebook-page.html.ejs
title: AkashaRender Projects, package.json, build process
# bookHomeURL: '/toc.html'
---

We have developed AkashaRemder to support two kinds of projects: websites and EPUB eBooks.  Theoretically it might, with some work, serve other purposes, but those are the ones we were have developed.  The commonality of both is that rendered output is HTML and CSS and image files.  What's different is the build procedure and the deployment of the built result.

Any AkashaRender-based project, whether website or EPUB, shares a set of attributes:

* A `package.json` describing the Node.js aspects of the project, including the project name, repository, scripts, and dependencies.
* One or more Configuration files describing
    * Directories containing assets, documents, layouts and partials.
    * Plugins providing needed functionality.

See [](configuration.html) to understand the project configuration.  In this chapter we'll discuss the `package.json` and how to use it to drive the build process.

# The package.json file

The `package.json` file is used by the Node.js platform to describe any package.  Because AkashaRender is written in Node.js, that makes the `package.json` a very natural tool.  This file provides AkashaRender projects with these useful features:

* A project name, author name, repository URL, etc.
* The `scripts` section can be used to automate processes like building and deploying the project
* The `dependencies` section can be used to bring in plugins and other packages

# Managing AkashaRender project dependencies

In the Configuration we declare plugins as follows (see [](configuration.html))

```js
config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'));
```

Since those are Node.js `require` statements it's necessary to have the named package in a directory Node.js will search.  The easiest way to do so is by adding those packages to the `dependencies` section in `package.json`.  Once you do that, the packages can be downloaded and updated using normal `npm` commands.

A minimal starting point for the dependencies is:

```json
"dependencies": {
    "akasharender": ">=0.7",
    "oembetter": "*",
    "hostr": "^2.x"
}
```

Then, for each of the plugins add a matching reference to install the corresponding package.  For the packages named above that would be:

```json
    "akashacms-base": "akashacms/akashacms-base#akasharender",
    "akashacms-breadcrumbs": "akashacms/akashacms-breadcrumbs#akasharender",
    "akashacms-theme-bootstrap": "akashacms/akashacms-theme-bootstrap#akasharender",
```

And then the `akashacms-theme-bootstrap` plugin has an additional dependency on having jQuery and Bootstrap installed, so these dependencies are useful:

```json
    "bootstrap": "^3.3.7",
    "jquery": "^3.1.1",
```

Going back to the `akashacms-NNNNN` dependencies, why did we not give version numbers and instead gave references to Github repositories?  As of this writing an old version of each of those packages are published in `npm`.  Those older packages are still compatible with the older `akashacms` and have not been updated to be compatible with `akasharender`.  The code which is compatible with `akasharender` is in the `#akasharender` branch of the corresponding repository.

Therefore, for the time being, we must install the plugin packages using those dependency specifiers.  In the due course of time the ecosystem compatible with `akashacms` will be deprecated, and the `akasharender` ecosystem will be published instead.

# Useful scripts targets for AkashaRender projects

One aspect of AkashaRender's design is the freedom to design your own build and deployment procedure.  The `akasharender` command provides a couple basics with the `copy-assets` and `render` commands.  You may want to minimize the files, encrypt them, package them as an EPUB, etc.  All those are outside the scope of the `akasharender` command.  

You are free to use any build tool you like, in the pursuit of your goals, to implement the build procedure of your dreams.  What we show here is a simple system built using the framework provided by `npm`.

The `scripts` section of `package.json` provides a competent useful framework for implementing your build and deployment procedures.  While it's not the be-all-end-all-ultimate-build-framework, `npm` scripts get the job done.  It is a tool that's automatically available through `npm` and doesn't require installing any additional anything.  It can immediately use any tool  executable via shell commands, even ones not written in Node.js.

These five `scripts` entries are a great starting point:

```json
"scripts": {
    "clean": "rm -rf out",
    "prebuild": "akasharender copy-assets config.js",
    "build": "akasharender render config.js",
    "preview": "cd out && ../node_modules/.bin/hostr",
    "deploy": "cd out && rsync --archive --delete ./ username@deploy.host.com:path/to/webroot/"
}
```

The `prebuild` command will automatically execute before `build` executes, so therefore `npm run build` automatically copies the asset files, then renders the content to the destination directory.

The `clean` command assures a clean slate.  If you want this run for every build, do this:

```json
"prebuild": "npm run clean && akasharender copy-assets config.js",
```

That is, these scripts can run multiple commands in sequence by using the `&&` pattern.  That pattern also ensures the command will be aborted if one section fails.

The `preview` command runs a small webserver on your computer, letting you preview the website without deploying it anywhere.

The `deploy` command shows using an external tool, like `rsync`.  In this case it automatically uploads the rendered website to a server.  Including this kind of `deploy` command is extremely **disrecommended** for projects kept in public repositories.  Disclosing the _username_ and _host_ combination to your web hosting account is a potential security problem.  Hence it may be best to leave `deploy` out of `package.json` to keep that information within your build system.

This command has a problem that's not entirely obvious.  The `rsync` command is depended on by the project, but that dependency is not declared in `package.json`.  How do you work with the project on a computer that does not have `rsync`, like a Windows machine?  You have to install `rsync` separately since it's not explicitly installed by `npm install`.  Further, the configuration required for password-less SSH login, as required by `rsync`, is also not under control of anything in `package.json`.  These system configuration and administrative attributes of the project are therefore not automated, and might be forgotten.

With `prebuild` and `build` we set up a two-stage build process.  You can easily set up a third stage, with `postbuild`.  What if your build process is more complex?

Consider:

```json
"build": "npm run render-site && npm run minify-site && npm run html-validation && npm run css-linter "
```

This orchestrates execution of a series of scripts you must define in `package.json`.  For example, a useful `minify-site` script uses the Node.js `html-minifier` package as so:

```json
"minify-site": "html-minifier --collapse-whitespace --conservative-collapse --html5 --keep-closing-slash --preserve-line-breaks --remove-comments --file-ext html  --input-dir out --output-dir out",
```

With these options, it minimizes the size of HTML files while still leaving them readable.

# Using continuous-integration systems for automated build and deployment

Automating repetitious tasks executed over and over is a good thing.  That's one reason for using the `scripts` section as we just discussed.  

Consider your workflow:  

* You'll edit some documents
* `npm run build`
* `npm run deploy`
* `git commit -a`
* `git push`

The last two steps presume you'll store the project files in a remote Git service, since that's such an excellent idea.

Does it make sense to run the `build` and `deploy` steps by hand?  Okay, it's not too onerous, but wouldn't it be nice to automate those steps.  It's possible to configure a system to trigger `build` and `deploy` automatically by pushing to a Git repository.

Here are three possibilities:

* Using a Git hook allows a shell script to run when the remote repository receives your update.
* A continuous integration server, like Jenkins, can be configured to poll a Git repository and kick off a job when the repository is updated.  This does mean installing two systems, the Git server and the continuous integration server.
* The Gitlab server includes an integrated continuous integration server.  By using Gitlab you have both an excellent Git server, and a continuous integration system, by installing only one system.
