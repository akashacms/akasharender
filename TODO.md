# Things to do in AkashaRender and the plugins

This should probably be kept in GitHub issues -- eventually

# Highlight.JS using JS in the browser

The current practice for code highlighting isn't working well.  The highlighting often looks bad.  Further, when Medium imports articles, it chokes badly on the highlighted code.

https://highlightjs.org/usage/ -- It can be configured to run JavaScript in the browser to perform the highlighting.

Alternatively there might be other tools that do a better job of code highlighting.

# Using gh-pages w/ GitHub token, or GitHub actions

Publishing from a headless Jenkins slave means setting up a Personal Access Token.

* https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
* https://docs.github.com/en/get-started/getting-started-with-git/caching-your-github-credentials-in-git
* https://github.com/GitCredentialManager/git-credential-manager

The credential manager was installed on Ubuntu from the `.deb` file supplied in that repository.  I had to manually run `npm run deploy` once:

```
$ npm run gh-pages

> guide@1.0.0 gh-pages /home/docker/jenkinslave/root/workspace/test-epubtools/guide
> akasharender gh-pages-publish config.js

Select an authentication method for 'https://github.com/':
  1. Device code (default)
  2. Personal access token
option (enter for default): 2
Enter GitHub personal access token for 'https://github.com/'...
Token: 
OK
```

This stored the personal access token in the credential manager.  It should all be good now.

Another route is to use GitHub actions for the publishing step.  Maybe it's not desirable to use GitHub actions for everything - build/test/npm-publish - but it seems that using GitHub actions for publishing the website is preferable.

* https://github.com/tschaub/gh-pages/issues/345
* https://github.com/UniversalDataTool/universal-data-tool/blob/master/.github/workflows/release-on-master.yml
* https://github.com/nchaulet/github-action-gh-pages/blob/master/entrypoint.sh
* https://github.com/nchaulet/github-action-gh-pages

This task requires learning how to set up GitHub Actions.  Once that's done, those links contain scripts to use the standard gh-pages command from the gh-pages package.

Our task is to expose anything required in AkashaRender's gh-pages command.  In particular it seems that `-u "github-actions-bot <support+actions@github.com>` setting is required.

# Add @akashacms/create-xyzzy packages

The `npm init` command allows for easy creation of example projects.

* https://docs.npmjs.com/cli/v8/commands/npm-init
* https://www.npmjs.com/package/create-esm
* https://github.com/standard-things/create-esm
* https://www.npmjs.com/package/pkg-install

The `create-esm` package is an example.  It ultimately uses the `pkg-install` package.

The goal is:

* `create-github-site` uses the current `open-source-site` example
* `create-epub` uses `epub-skeleton`
* etc


# Replace sightmap

This is an ancient package, that basically see's zero usage.  Surely there is a better package.

Bonus points for something that builds Google News XML files

https://www.npmjs.com/package/sitemap - Looks very modern and comprehensive

https://www.npmjs.com/package/easy-sitemap - Much lighter weight

# Convert some or all code to TypeScript and/or ES6

It's the way of the future.  AkashaRender has some needs for advanced data type support.

# Revisit the choice of Commander in cli.js

Perhaps "yargs" is better?

Maybe cli.js can be rewritten as a zx script?

# Supporting responsive image formats

Nowadays we can write something like the following to instruct web browsers to use optional image sizes or formats.

```
<img srcset="img1-480.jpg 480w, img1-600.jpg 600w, img1.jpg"
    sizes="(media query) 480w, (media query) 600w"
    src="img1.jpg"/>
```

```
<picture>
    <source type="image/webp" src="img1.webp">
    ...
    <img src="img1.jpg"/>
</picture>
```

There's a lot more to this, and the MDN has a useful overview.  A dumb browser will fall back to the element it recognizes, `<img>`.  The other elements and attributes add new capabilities.  The gain is reducing the payload required to be loaded, and therefore improving page load times.

* https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
* https://blog.cloudfour.com/responsive-images-101-definitions

What AkashaCMS should do:

* Develop a processor function to take a simple standard `<img>` tag, and auto-convert it
* Configuration options in `config.js` to drive what to do
* Prefer the `<picture>` element, using `<source type=>` with no `media=` attribute.  The discussion on `blog.cloudfour.com` explains why
* Ignore images where there is an existing `<picture>` element or `srcset/sizes` attributes.  In such a case the author will have already selected what to do.
* Rewrite images to WEBP or other hyper-compressed format, then write the suitable `<picture>` element.

# Data tables

It will be useful to load data into the ForerunnerDB cache system.  The data can be useful to plugins or templates.

In `config.js`:

```js
config.dataTables([
    {
        href: 'path/to/file.yaml',  # Also support JSON or CSV
        name: 'collection-name',
        persist: true/false,
    },
    ...
]);
```

Create a `DataTable` class.  There must be a Chokidar instance to watch for changes in data table files.  When a data file is updated, reload, or if unlinked, then remove the table.

The `DataTable` class can provide a few methods for searching the data.

Perhaps a plugin like Affiliates can be rewritten to use DataTable?  As it stands, the Affiliates plugin has been rewritten with some custom code creating a Collection etc.

For example, a DataTable of electric vehicle attributes - of solar panel attributes - of Linux Single Board Computer attributes - could be used in content.
