# Things to do in AkashaRender and the plugins

This should probably be kept in GitHub issues -- eventually

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
