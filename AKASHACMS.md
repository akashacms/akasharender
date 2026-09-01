# AkashaCMS Project constituents

AkashaCMS is a system of components for rendering various files into HTML, CSS, JavaScript, and Image assets that can be used in websites, and generating EPUB and PDF electronic books.  AkashaCMS is meant to be flexible enough for use in any target relying on HTML/CSS/JavaScript/image files.

AkashaRender (this repository) is the rendering engine for AkashaCMS.

AkashaCMS is not a concrete application, but is the name for the group of technologies used with AkashaRender for producing HTML/CSS/JavaScript/image files.

These components can be categorized as:

* Core modules
* Products
* Plugins
* Tools
* Documentation
* Examples

The known set of AkashaCMS components are housed on GitHub within the [AkashaCMS organization](https://github.com/akashacms) as individual [AkashaCMS repositories](https://github.com/orgs/akashacms/repositories)

## AkashaCMS Core Modules

[`akasharender`](https://github.com/akashacms/akasharender) is the source code for the `akasharender` command.  It is the core of the AkashaCMS ecosystem.

[`mahabhuta`](https://github.com/akashacms/mahabhuta) is the source code of `mahabhuta`.  Its purpose is server-side DOM manipulation using a jQuery-like API (Cheerio).  It supports creation of Mahafuncs, which are TypeScript classes for several types of DOM manipulation, as well as orchestrating the run of the complete set of DOM manipulations used by a given project.  Plugins typically use Mahabhuta for custom HTML elements and other processing required to implement their functionality.

[`plugins-diagrams`](https://github.com/akashacms/plugins-diagrams) is the source code for the `@akashacms/diagram-makers` framework.  This is a set of plugins supporting different diagramming frameworks such as PlantUML or Mermaid.

[`rendering-engines`](https://github.com/akashacms/rendering-engines) is the source code of the `@akashacms/renderers` package.  This framework supports any task where an input format is rendered to HTML, CSS or JavaScript.  Its primary purpose is integrating several HTML template engines (EJS, Nunjucks, etc) to process HTML files, and integrating MarkdownIT and `@asciidoctor/core` for rendering Markdown and Asciidoc files.

AkashaRender, Mahabhuta, and Rendering Engines together form the core of AkashaCMS.  However, Mahabhuta and Rendering Engines are designed to be usable separately.

## AkashaCMS Products

[`pdf-document-construction-set`](https://github.com/akashacms/pdf-document-construction-set) is the source code of _PDF Document Maker_, a.k.a. `@akashacms/pdf-document-maker`.  This is a comprehensive application for building very nice PDF documents from Markdown or AsciiDoc files.

## AkashaCMS Plugins

[`akashacms-adblock-checker`](https://github.com/akashacms/akashacms-adblock-checker) is the source code of the `@akashacms/plugins-adblock-checker`.  Its purpose is to implement a simplistic method of detecting whether advertising display has been blocked.

[`akashacms-affiliates`](https://github.com/akashacms/akashacms-affiliates) is the source code of the `@akashacms/plugins-affiliates` plugin.  Its purpose is to support using Affiliate Marketing in an AkashaCMS website.  It best supports the Amazon affiliate program. 

[`akashacms-plugin-authors`](https://github.com/akashacms/akashacms-plugin-authors) is the source code of the `@AkashaCMS/plugins-authors` plugin.  Its purpose is rendering author bio blocks on pages.

[`akashacms-base`](https://github.com/akashacms/akashacms-base) is the source code of the `@akashacms/plugins-base`.  It provides basic HTML website functions suitable for every website project.  It should therefore be integrated into any website project.

[`akashacms-booknav`](https://github.com/akashacms/akashacms-booknav) is the source code of the `@akashacms/plugins-booknav`.  It provides navigation for a group of AkashaCMS pages.

[`akashacms-dlassets`](https://github.com/akashacms/akashacms-dlassets) is the soruce code of the `@akashacms/plugins-dlassets` plugin.  It auto-downloads "assets" that are linked from an external site (e.g. `<img src="https://somewhere.else.com/path/to/FantasticStory.jpg"/>`) so that the asset is no longer remote.  This was initially created for EPUB creation.

[`akashacms-breadcrumbs`](https://github.com/akashacms/akashacms-breadcrumbs) is the source code of the `@akashacms/plugins-breadcrumbs` plugin.  Its purpose is creating a "breadcrumb trail" leading through the website directory hierarchy from the home page to the current page.

[`akashacms-blog-podcast`](https://github.com/akashacms/akashacms-blog-podcast) is the source code of the `@akashacms/plugins-blog-podcast` plugin.  Its purpose is organizing some of the content of an AkashaCMS project as a blog.  NOTE: It does not actually support podcast publishing.

[`akashacms-document-viewers`](https://github.com/akashacms/akashacms-document-viewers) is the source code for the `@akashacms/plugins-document-viewers` plugin.  The purpose is making it easy to display a document on a webpage.  It uses an external JavaScript viewer.  The primary working path is PDF viewing.  The implementation is currently incomplete, lacking maintenance, and only the PDF path is tested.

[`akashacms-embeddables`](https://github.com/akashacms/akashacms-embeddables) is the source code of the `@akashacms/plugins-embeddables` plugin.  Its purpose is to support embedding thingymajigs in page.  The primary example is to make it easy to add YouTube videos to a website.  There are many potential thingymajigs that can be embedded, many of which might be embeddable with this plugin.  As of this writing, the plugin implementation is a mess, and only the YouTube path is properly tested.

[`akashacms-external-links`](https://github.com/akashacms/akashacms-external-links) is the source code of the `@akashacms/plugins-external-links` plugin.  Its purpose focuses on outbound links from a website.

[`akashacms-footnotes`](https://github.com/akashacms/akashacms-footnotes) is the source code of the `@akashacms/plugins-footnotes` plugin.  Its purpose is an implementation of "footnotes" with an inline link to a note at the end of the document.  It does not use the Markdown standard format for footnoting.  If that's desired one should instead incorporate one of the Markdown-IT footnoting extensions.

[`akashacms-tagged-content`](https://github.com/akashacms/akashacms-tagged-content) is the source code of the `@akashacms/plugins-tagged-content` plugin.  Its primary purpose is producing index pages for those pages with the same content tag.

[`akashacms-theme-bootstrap`](https://github.com/akashacms/akashacms-theme-bootstrap) is the source code of the `@akashacms/theme-bootstrap` plugin.  This integrates the Bootstrap theme into AkashaCMS projects.

[`bootstrap-icons`](https://github.com/akashacms/bootstrap-icons) is the source code of the `@akashacms/bootstrap-icons` plugin.  This is a simple wrapper making the Bootstrap Icons collection available in AkashaCMS projects.

[`country-flag-icons`](https://github.com/akashacms/country-flag-icons) is the source code of the `@akashacms/country-code-icons` plugin.  This is a simple wrapper making available an icon library of the flags of countries on Planet Earth.

[`tabler-icons`](https://github.com/akashacms/tabler-icons) is the source code of the `@akashacms/tabler-icons` plugin.  This is a simple wrapper making the Tabler Icons collection available in AkashaCMS projects.

## AkashaCMS Tools

[`akasharender-epub`](https://github.com/akashacms/akasharender-epub) is the source code of a command for building EPUB documents from AkashaCMS projects.

[`epubtools`](https://github.com/akashacms/epubtools) is the source code for the `epubtools` command.  This handles core tasks related to building EPUB documents.  NOTE: Its current status is that it hasn't been maintained for awhile, and desparately needs an update.

[`epub-website`](https://github.com/akashacms/epub-website) is an AkashaCMS plugin making it easy to publish content to either an EPUB or a Website.

[`mermaid-wasm-renderer`](https://github.com/akashacms/mermaid-wasm-renderer) is an integration of the WASM compilation of a Rust-based Mermaid renderer.  It is used by `@akashacms/diagram-makers` for Mermaid rendering.

[`akashacms-perftest`](https://github.com/akashacms/akashacms-perftest) is a woefully incomplete set of performance tests for AkashaCMS.  High on aspirations, low on completeness.

## AkashaCMS Documentation

[`akashacms-website`](https://github.com/akashacms/akashacms-website) is the source code used to produce the `akashacms.com` website.  This website contains the primary documentation of the AkashaCMS ecosystem.  It also serves as an example of a complex AkashaCMS project configuration, and one of the testing tools for integrating AkashaCMS components.

[`epub-guide`](https://github.com/akashacms/epub-guide) is documentation for EPUB tools in AkashaCMS.

## AkashaCMS Examples

[`akashacms-example`](https://github.com/akashacms/akashacms-example) is an example AkashaCMS website project where the primary purpose is demonstrating all features in the AkashaCMS ecosystem.  Do not expect a highly polished user experience.  Its primary purpose is demonstrating each feature.  The presentation on the website, [`example.akashacms.com`](https://example.akashacms.com), is not the primary point, but it is the configuration and document files.

[`open-source-site`](https://github.com/akashacms/open-source-site) is the source code of the website for an imaginary open source software project.  The purpose is demonstrating how an open source software project could use AkashaCMS to publish a fairly nice looking website to GitHub Pages, or to regular website hosting.

[`akashacms-skeleton`](https://github.com/akashacms/akashacms-skeleton) is the source code of a skeletal website.  Its meant to be used as a starting place for website projects.

[`akashacms-blog-skeleton`](https://github.com/akashacms/akashacms-blog-skeleton) is the source code of a skeletal blog website.  Its meant to be used as a starting place for website projects that include blogging.

[`epub-skeleton`](https://github.com/akashacms/epub-skeleton) is the source code of a skeletal EPUB.  It's meant to be used as the starting place for an EPUB.
