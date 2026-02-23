---
title: Customizing Markdown-IT
layout: ebook-page.html.ejs
publicationDate: February 23, 2026
---
As we noted in [](./configuration.html), the Markdown-IT engine is used for converting Markdown to HTML.  The community around this engine has developed a long list of plugins that give useful extensions.  One reason for this is to increase compatibility with the Markdown support in certain popular tools, such as the GitHub-Flavored Markdown used by GitHub, or the Obsidian-Flavored Markdown used in Obsidian.

The process for adding a Markdown-IT plugin is:

- Add the plugin package to `package.json`
- Add the package as an import in the configuration file
- Tell the Markdown-IT package to use the plugin
- Pass any options object

For example:

```js
import { default as MarkdownITHighlightJS } from 'markdown-it-highlightjs';
config.findRendererName('.html.md')
	.use(MarkdownITHighlightJS, {
		auto: true,
		code: true
	});
```

This particular plugin enables syntax highlighting for code blocks using the `highlight.js` package.

## Adding either id= or class= attributes to HTML

One way to create interesting effects is to add an `id=` or `class=` attribute to something in the HTML, then to define matching CSS to create the desired effect.

Because Markdown allows the use of HTML tags you could do `<h1 class="section-h1">` instead of using the Markdown `#` tag.  But, it's preferable to use the native Markdown syntax.

Two packages work together to implement this in native Markdown syntax.  The method is borrowed from Pandoc.

```js
  

import { default as MarkdownITBracketedSpans } from 'markdown-it-bracketed-spans';

import { default as MarkdownItAttrs } from 'markdown-it-attrs';

// ...
config
	// ...
	.use(MarkdownITBracketedSpans)
	.use(MarkdownItAttrs, {
		allowedAttributes: [ 'id', 'class', 'caption', 'data' ]
	})
	// ...
```

The `-attrs` plugin allows you to write this:

```markdown
# header {.style-me}

paragraph {data-toggle=modal}

paragraph *style me*{.red} more text
```

Which causes this output:

```html
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
<p>paragraph <em class="red">style me</em> more text</p>
```

In other words you add `{ stuff }` after some Markdown markup, and it applies `id=` or `class=` or other attributes to the HTML output.

The `-bracketed-spans` plugin extends this effect to longer stretches of text.  

Consider:

```markdown
Text with desired primary{.text-primary} attribute.

Other text using [bracketed span to utilize the primary]{.text-primary} attribute.
```

The part, `[bracketed span to utilize the primary]` renders as

```html
<span>bracketed span to utilize the primary</span>
```

Adding `{.text-primary}`adds `class="text-primary"` to the `<span>`.  And, the Bootstrap framework uses that class to color the text within the `<span>` with the primary color.  Or: [bracketed span to utilize the primary]{.text-primary}

## Simplify adding a `<div>` block

```js
import { default as MarkdownItDiv } from 'markdown-it-div';

config.findRendererName('.html.md')
.use(MarkdownItDiv);
```

https://www.npmjs.com/package/markdown-it-div

## Adding `<section>` tags corresponding to header tags

```js
import { default as MarkdownItSections } from 'markdown-it-header-sections';

config.findRendererName('.html.md')
.use(MarkdownItSections);
```

https://www.npmjs.com/package/markdown-it-header-sections

## Convert image references into `<figure>` tags

```js
import { default as MarkdownItImageFigures } from 'markdown-it-image-figures';

config.findRendererName('.html.md')
.use(MarkdownItImageFigures, {
	dataType: true,
	figcaption: true,
	tabindex: true
});
```

https://www.npmjs.com/package/markdown-it-image-figures

## Multimarkdown table format

```js
import { default as MarkdownItMultiMDTable } from 'markdown-it-multimd-table';

config.findRendererName('.html.md')
.use(MarkdownItMultiMDTable, {
	multiline: true,
	rowspan: true,
	headerless: true,
	multibody: true,
	aotolabel: true,
});
```

https://www.npmjs.com/package/markdown-it-multimd-table


## Add `<caption>` tag to a table


```js
import { default as MarkdownItTableCaptions } from 'markdown-it-table-captions';

config.findRendererName('.html.md')
.use(MarkdownItTableCaptions);
```

https://www.npmjs.com/package/markdown-it-table-captions

## Obsidian Callouts

```js
  
import { default as mdItObsidianCallouts } from 'markdown-it-obsidian-callouts';

config.findRendererName('.html.md')
.use(mdItObsidianCallouts);
```

https://www.npmjs.com/package/markdown-it-obsidian-callouts

## Even more Markdown-IT plugins

- [https://github.com/alexjv89/markdown-it-obsidian](https://github.com/alexjv89/markdown-it-obsidian) - add suport for obsidian wikilinks
- [https://github.com/glitchassassin/markdown-it-obsidian-images](https://github.com/glitchassassin/markdown-it-obsidian-images) - add support for obsidian wikilinks for images
- [https://github.com/antfu/markdown-it-github-alerts](https://github.com/antfu/markdown-it-github-alerts) - support for github alerts as annotated blockquote
- https://www.npmjs.com/package/markdown-it-task-lists - GitHub-style task lists
- https://www.npmjs.com/package/markdown-it-emoji - Emoji's
- https://www.npmjs.com/package/markdown-it-sup - `<sup>` tag support
- https://www.npmjs.com/package/markdown-it-footnote - Footnotes
- [https://github.com/commenthol/markdown-it-admon](https://github.com/commenthol/markdown-it-admon) - rST-style admonitions
- [https://github.com/docarys/markdown-it-admonition](https://github.com/docarys/markdown-it-admonition) - Docarys admonitions

And, even more: https://www.npmjs.com/search?q=keywords:markdown-it-plugin
