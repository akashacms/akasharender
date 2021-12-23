---
layout: ebook-toc-page.html.ejs
title: Table of Contents
tags: AkashaRender
headerHeight: "140px"
bookTitle: "AkashaRender User Guide"
bookAuthor: "David Herron"
authors: "David Herron"
published: "2021 David Herron"
language: "English"
coverImage: "/Human-Skeleton.jpg"
noLogoImage: "true"
# EPUB download, PDF download
outline:

    - 1. Introduction
    - 2. Setup
    - 3. Basics of creating content files
    - 4. Configuration files
    - 5. Projects - package.json - build procedure
    - 6. Layouts and Partials
        - 1. CSS and LESS files.
    - 7. Using Plugins
        - 1. Plugin configuration
        - 2. Using Mahabhuta tags
    - 8. Writing Plugins
        - 1. Supplying partials or layouts or assets
        - 2. Writing Mahabhuta
        - 3. Overriding assets from other plugins
    - 9. Writing a rendering engine
    - 10. Advanced configuration
        - 1. Blogs & RSS generation
        - 2. Assembling content or assets from multiple sources
        - 3. EPUB generation
        - 4. Publishing to SSH based Apache server
        - 5. Publishing to GitHub Static pages
        - 6. Publishing to GitLab static pages
        - 7. Publishing to Amazon S3

---

<nav epub:type="toc" id="toc">

<ol type="1" start="1">
    <li><a href="index.html" id="index"></a></li>
    <li><a href="2-setup.html" id="setup"></a></li>
    <li><a href="3-create-content.html" id="create-content"></a></li>
    <li><a href="configuration.html" id="configuration"></a></li>
    <li><a href="layouts-partials.html" id="layouts-partials"></a>
        <ol>
            <li><a href="css-less.html" id="css-less"></a></li>
                <li><a href="theming.html" id="theming"></a></li>
        </ol>
    </li>
    <li><a href="command-line.html" id="command-line"></a></li>
    <li><a href="plugins-using.html" id="plugins-using"></a></li>
    <li><a href="plugins-writing.html" id="plugins-writing"></a></li>
    <li><a href="rendering-engines.html" id="rendering-engines"></a></li>
</ol>

</nav>
