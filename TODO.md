# Things to do in AkashaRender and the plugins

This should probably be kept in GitHub issues -- eventually

# Using Bluesky posts as comments

https://emilyliu.me/blog/comments

# Develop wholly new thing - SimpleCMS

Start with the SimpleCMS example and build it out.

Do not use the existing Plugin system.  Instead, use a simplified MahaArray approach.  Develop Arrays for:

* Building HTML headers - JavaScript, CSS, and metadata
* HTML cleanups
* Image/Figure
* Microformats etc
* Book navigation structure
* Blog navigation structure
* Build RSS from collections
* Build XMLSitemap from collections
* Partials

Keep these function arrays to the minimum.  Also offer a mechanism to plug-in function arrays.

Use the Renderers package.  But, focus on Nunjucks for fancy stuff using their macro system.

Processing order -- Does MarkdownIT pass through Nunjucks or other template code unmolested?

A "theme" is therefore a collection of CSS/JS and Nunjucks macros.  It should be possible to convert macros from e.g. readthedocs or other sources.

To support querying "collections" there must be a file cache similar to the current thing.  This cache must use strict object schemas and typescript types to simplify writing code.  A "collection" is a query into the file cache.

Most configuration should be done using command-line options.

Configuration for MarkdownIT will require JavaScript.  Instead of plugins like "Footnotes" it should rely on the existing MarkdownIT plugins for that purpose.




1. In Renderers, develop a method for configuring MarkdownIT with native plugins
2. Possible processing order
   1. "content-template" header to name the template system for the content?
   2. First render using the content template system, then render either MarkdownIT or AsciiDoc
   3. "layout" header to name the layout template, processing the layout template using the content from step 2
3. Develop file cache system on top of Stacked Dirs
   1. Store file information along with in-memory indexes
   2. Query mechanism e.g. for "collections"
4. 


# Collapse some of the plugins into akashacms-base or -builtin?

For example, why is the Breadcrumbs tag a separate plugin?  The footnotes plugin shouldn't exist, and it should instead configure footnote support in Markdown-IT.

A performance boost will be derived by decreasing the number of Mahabhuta tags.

# Move to Bootstrap v5 for Bootstrap theme

Examples site would have a sub-area for Bootstrap examples

The existing Bootstrap Theme plugin needs to have an npm tag "bootstrap4" and remain frozen.  That also requires a Git branch for Bootstrap4.

1. Git branch - Bootstrap4 - npm branch - bootstrap4 - to freeze it at compatibility with 0.9 release
2. On main branch, move to Bootstrap 5

# Move to relying more on templates and less on custom elements

The header metadata tags - they're already templates, why do they require a custom element.

Each custom element takes some CPU to process the element.  Reducing the number of custom elements will reduce execution time.

# Remove Tag Cloud implementation from plugin-tagged-content, move rest to plugin-builtin

The ability to present tags, and have tagged content, should be a built-in feature.

Ensure that FileCache tracks documents-with-tags and provides useful functions for retrieving the documents by tag name.  This should already be there.

Instead of creating an index page for every tag, instead have - index page name & list of tag names - as configuration settings.  This also requires a command to list the tags, and to list the indexes (and tags), and to list the tag names that are not on an index page.

Index page generation could be in the base plugin instead of built-in.


??????
Instead, when a document arrives with tags, enter the information into an index Map.

```js
const tagIndex = new Map<tagName, Array<vpath>>()
```

This keeps a list for each tag name mapping to a list of vpath's.  But, how to maintain it?

Have to consider

* When the fileCache initially adds a document, recording the tags in that array
* When the fileCache updates a document, handle the update to tags->vpath mapping
* When the fileCache deletes a document, handle deleting the tags->vpath mappings

Hence it requires creating a Class to manage the association.  It should have methods:

* recordDocumentTags(documentInfo) --
* updateDocumentTags(documentInfo) --
* forgetDocumentTags(documentInfo) --
/????????????


# In StackedDirs create a schema for file data, and automatic validation

UPDATE: Maybe a JSON Schema is not required.  The StackedDirs package exports a class, VPathData, that is well structured.  I've added some comments for documentation.  There is also a type guard function which can enforce correctness.  I've just made a change, to export that function, and to also use it in a few more places.

UPDATE: The remaining task becomes - for code using StackedDirs - that code must know the correct type.  As it is, it's an anonymous object received on an EventEmitter listener.

UPDATE: What's needed is a listener API function that receives typed parameters.  Maybe.

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
