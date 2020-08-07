---
layout: ebook-page.html.ejs
title: Theming an AkashaRender Project
publicationDate: June 25, 2017
---

Unlike the other parts of AkashaCMS we've talked about, theming is not precisely defined.  A site "theme" touches on the CSS, fonts, layout, and possibly the HTML "framework" you choose.  For example the simplest framework to adopt is Twitter's Bootstrap, which gives a solid foundation of mobile-responsive HTML5 CSS3 goodness.  Bootstrap provides many built-in components that are nice ways to present information.

The basic mechanisms with which to establish the theme for your site are:

* Layout templates
* Partials, especially overriding the plugin-provided partials
* CSS declarations of color, font, and text style choices

Let's see how this goes.

# Installing Bootstrap or other HTML framework

For most/all the HTML frameworks, the key thing is using the framework's CSS files, then apply your own CSS files for your custom look.

## Using Bootstrap in an AkashaCMS project

We've already gone over installing Bootstrap in an AkashaCMS project.  

In `package.json` add this to the `dependencies` section

```json
    "bootstrap": "^4.5.x",
    "jquery": "^3.5.x",
    "popper.js": "^1.16.x"
```

Those bring in the distribution files for those projects that are meant to be used in the browser.  Simply mount the distribution directories into your AkashaRender configuration, and those files will be copied to the rendering destination.

```js
config
    .addAssetsDir({
        src: 'node_modules/bootstrap/dist',
        dest: 'vendor/bootstrap'
    })
   .addAssetsDir({
        src: 'node_modules/jquery/dist',
        dest: 'vendor/jquery'
    })
```

Now declare the JavaScript and Stylesheets to be used on your pages.  The `style.css` file is meant to be where you customize things for your site.

```js
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({       href: "/style.css" });
```

The `akashacms-theme-bootstrap` plugin provides some nice Bootstrap-friendly overrides of various partials.

```js
config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
```

## Extending Bootstrap CSS

Out of the box a Bootstrap site certainly doesn't suck, it's fairly decent.  But do you want your site to look like every other Bootstrap site?  

The Bootstrap project site offers a way to download a customized Bootstrap distribution.  You can use that instead of what you'd get with the `package.json` dependency shown above.  See:  http://getbootstrap.com/customize/

You can also download the source code and hack on it:  http://getbootstrap.com/getting-started/

## Bootstrap theme directories

Some existing themes are available for Bootstrap:

* http://bootswatch.com/
* https://wrapbootstrap.com/
* https://startbootstrap.com/template-categories/all/
* https://bootstrapmade.com/
* https://www.bootstrapzero.com/

## HTML5 Boilerplate, or other frameworks

The HTML5 Boilerplate provides an excellent foundation for HTML5 page templates, `.htaccess` files, and normalization of CSS.  What's in the Boilerplate project is the distilled knowledge of best practices from hundreds of seasoned front end developers.  

https://html5boilerplate.com/

The project's value is not just the HTML5/CSS/JS base files, but the documentation on the Github project Wiki

https://github.com/h5bp/html5-boilerplate/blob/5.3.0/dist/doc/TOC.md

The best way to use Boilerplate in your AkashaCMS project is to study the HTML, using it as the starting point for the HTML in your page layouts.  From this file https://github.com/h5bp/html5-boilerplate/blob/5.3.0/dist/index.html we can easily derive a base page template.

```html
<!doctype html>
<html class="no-js" lang="">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title><%= title %></title>
        <meta name="description" content="<%= description %>">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="apple-touch-icon" href="apple-touch-icon.png">
        <!-- Place favicon.ico in the root directory -->

        <ak-header-metatags></ak-header-metatags>
        <xml-sitemap></xml-sitemap>
        <site-verification google="... If you get a Google site-verification code, add it here"></site-verification>

        <!-- Declare stylesheets, JavaScript and other things in the Configuration -->
        <ak-header-linkreltags></ak-header-linkreltags>
        <ak-stylesheets></ak-stylesheets>
        <ak-headerJavaScript></ak-headerJavaScript>

    </head>
    <body>
        <!--[if lt IE 8]>
            <!-- This would be included if you want to nag your readers about their old browser. -->
            <p class="browserupgrade">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
        <![endif]-->

        <!-- Add your site or application content here.  You should define the desired page layout
             including headers, footers, sidebars, etc.  Somewhere within that page layout, use this
             custom tag to bring in the content. -->
        <%- content %>

        <!-- Declare other JavaScript for the footer for inclusion here -->
        <ak-footerJavaScript></ak-footerJavaScript>

        <!-- NOTE: The Boilerplate template had an in-line piece of Google Analytics code.
             With AkashaRender it's better to put your Google Analytics in a Partial,
             and to use the code Google provided. -->
        <partial file-name="google-analytics.html"/>
    </body>
</html>
```

With other HTML5 frameworks you'll do something similar.  Define a base page layout from the recommendations of the framework, and use the Configuration file to bring in CSS and JavaScript.

# Overriding partials

A key AkashaRender principle is overridability, or the ability to override anything provided by AkashaCMS plugins.  This principle doesn't always play well, but it's a good goal to strive for.  One key is to override Partial's, and a great example is the Partial's supplied by the `akashacms-theme-bootstrap` plugin:  https://github.com/akashacms/akashacms-theme-bootstrap

In its `partials` directory (https://github.com/akashacms/akashacms-theme-bootstrap/tree/master/partials) you'll see partial's overriding specific ones from other plugins.  For example the `booknav-child-tree.html.ejs` (https://github.com/akashacms/akashacms-theme-bootstrap/blob/master/partials/booknav-child-tree.html.ejs) implementation uses a Bootstrap `list-group` to improve the presentation.

Almost every custom tag provided by an AkashaCMS plugin is coupled tightly to a Partial.  To change the look of that custom tag, simply implement your version of that Partial being careful to use the same data items.
