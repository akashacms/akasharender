# Things to do in AkashaRender and the plugins

This should probably be kept in GitHub issues -- eventually

# Replacing LokiJS with MongoDB using mongodb-memory-server

The `mongodb-memory-server` project automatically instantiates a MongoDB that works only in memory.  It was meant for testing.  But it could serve AkashaRender as well, since LokiJS serves as an in-memory database which is dispensed when done.

The problem with LokiJS is the lack of capabilities, and that its development halted over 2 years ago.  It does not have anything like aggregation pipelines, for example.

Otherwise it can be replaced with some intelligent data structures?

For example each item scanned by StackedDirs/FileCache can be in

```js
  Map<string, fileInfo> // where the string is the vpath
```

Other indexes to this could be Map from various values to the vpath

```js
Map<dirNameString, Array<vpath>> // string for dirnames, to a list of vpaths in that dir
```

Or, maybe that approach won't work since it is so brittle and takes a lot to keep up the indexing.

# Move to Bootstrap v5 for Bootstrap theme

Examples site would have a sub-area for Bootstrap examples

The existing Bootstrap Theme plugin needs to have an npm tag "bootstrap4" and remain frozen.  That also requires a Git branch for Bootstrap4.

1. Git branch - Bootstrap4 - npm branch - bootstrap4 - to freeze it at compatibility with 0.9 release
2. On main branch, move to Bootstrap 5

# Move to relying more on templates and less on custom elements

The header metadata tags - they're already templates, why do they require a custom element.

Each custom element takes some CPU to process the element.  Reducing the number of custom elements will reduce execution time.

# In StackedDirs create a schema for file data, and automatic validation

Prevent failures by preventing creation of bad file information

In AkashaRender/FileCache extend that schema, and simplify the data structure.  Currently there are many special cases.

Define types for these objects so that VSCode can intelligently assist with writing code.

# Productize the DIY Website for open source projects concept

NAME: PublishTheDocs -- play on ReadTheDocs ??

Make sure all components are complete enough to have real releases.

Goal for an open source project:

* Website w/ documentation, blog, e-book, API docs, etc - whatever is required by software projects
* e-Books which are easily bundled as EPUB in addition to display on the web
* Study the ReadTheDocs user experience for an online EPUB viewer
* Port a ReadTheDocs theme for use with EPUB, or else a Jekyll theme
* Easily usable on GitHub pages
* Hence easily managed on GitHub
* Also support for Gitea and GitLab

Everything is close to product-ready.  It doesn't have to be fully ready to start showing folks how to use it.

Record videos about usage - on YouTube

Write articles that end up on Medium and published to ITNEXT

# Implementing an article style where a parallel pane automatically scrolls through code.

See: https://annotate.dev/p/hello-world/learn-oauth-2-0-by-building-your-own-oauth-client-U2HaZNtvQojn4F

This is a service, `annotate.dev`, for hosting articles that have code in a sidebar...?

Anyway, it seems this can be implemented in Bootstrap using Scrollspy: https://getbootstrap.com/docs/5.3/components/scrollspy/

The idea is as the reader scrolls through the article, that the sidebar automatically shows related stuff.


# Highlight.JS using JS in the browser

The current practice for code highlighting isn't working well.  The highlighting often looks bad.  Further, when Medium imports articles, it chokes badly on the highlighted code.

https://highlightjs.org/usage/ -- It can be configured to run JavaScript in the browser to perform the highlighting.

Alternatively there might be other tools that do a better job of code highlighting.

# Minimal metadata for social media

https://meiert.com/en/blog/minimal-social-markup/

https://cards-dev.twitter.com/validator

https://www.linkedin.com/post-inspector/

https://developers.facebook.com/tools/debug/


```html
<!-- <head> (and <body>) needed for LinkedIn -->
<head>
  <!-- “twitter:card” and title needed for Twitter -->
  <meta name=twitter:card content=summary_large_image>
  <meta property=og:title content="This is a test title">
  <!-- Quotes needed for WhatsApp and Signal -->
  <meta property="og:description" name="description" content="This is a test description.">
  <meta property="og:image" content="https://hell.meiert.org/core/png/test.png">
</head>
```

# Metadata for the FediVerse

https://en.wikipedia.org/wiki/Fediverse

https://en.wikipedia.org/wiki/ActivityPub

The idea is for an AkashaCMS site to be usable in FediVerse.  Hopefully there is a comments system which can be used.

Example for Eleventy -- https://lewisdale.dev/post/you-can-be-friends-with-my-blog/

https://lewisdale.dev/post/get-your-eleventy-site-onto-the-fediverse/

https://github.com/LewisDaleUK/eleventy-plugin-activity-pub

This talks about generating a file where one purpose is to point to a WebFinger file.  WebFinger is a well-known protocol.

https://maho.dev/2024/02/a-guide-to-implement-activitypub-in-a-static-site-or-any-website/ -- This is a complete guide on implementing ActivityPub on a static website platform.

https://book.micro.blog/activitypub/ -- Explanation of the protocol pieces.  https://book.micro.blog/ -- Full book about micro-blogging and more.

https://www.theverge.com/24063290/fediverse-explained-activitypub-social-media-open-protocol

https://dev.to/thasmin/getting-started-with-activitypub-2mgm

Lists of tools:

* https://github.com/BasixKOR/awesome-activitypub
* https://codeberg.org/fediverse/delightful-activitypub-development/

https://activitypub.ghost.org/

https://activitypub.rocks/ -- Documentation, tools, etc

Wordpress

* https://wedistribute.org/2023/09/connect-wordpress-to-the-fediverse/
* https://jseggers.com/technology/how-to-set-up-activitypub-for-self-hosted-wordpress-sites/
* https://fedi.tips/wordpress-turning-your-blog-into-a-fediverse-server/
* https://andreas.heigl.org/2022/10/30/tweaking-a-wordpress-blog-for-the-fediverse/

WriteFreely -- https://writefreely.org/

https://github.com/tsileo/microblog.pub

https://github.com/oelna/microblog -- Simple PHP site for activitypub etc

Node.js

* https://www.npmjs.com/search?q=fediverse
* https://www.npmjs.com/package/megalodon
* https://www.npmjs.com/package/fedi-get-key
* https://www.npmjs.com/package/@fedify/markdown-it-mention
* https://www.npmjs.com/package/masto
* https://www.npmjs.com/package/@fedify/fedify
* https://www.npmjs.com/package/@musakui/fedi
* https://www.npmjs.com/package/@fedikit/nodeinfo
* https://www.npmjs.com/search?q=%40fedikit
* https://www.npmjs.com/package/peertube-plugin-hive-tube
* https://community.nodebb.org/category/30/activitypub
* https://github.com/immers-space/activitypub-express

https://join-lemmy.org/

Specs

* https://w3c.github.io/activitypub/

Otherwise - Emote for commenting - https://www.ezoic.com/posts/emote-free-comments-section-for-websites/

# Icons

https://humbleicons.com/


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


# Convert some or all code to TypeScript and/or ES6

It's the way of the future.  AkashaRender has some needs for advanced data type support.

# Image rewriting with Sharp

Make sure we can rewrite to WEBP

Simple script interface that turns into Sharp commands - e.g. for compositing - Maybe this can be a separate tool.

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
