---
layout: njk-funcs.html.njk
title: NJK template calling functions
publicationDate: 2021-11-06
headerJavaScriptAddTop:
    - href: '/vender/metadata-js-add-top.js'
    - href: '/vender/metadata-js-with-lang-add-top.js'
      lang: 'no-known-lang'
    - script: alert('added to top from metadata');
headerJavaScriptAddBottom:
    - href: '/vender/metadata-js-add-bottom.js'
    - href: '/vender/metadata-js-with-lang-add-bottom.js'
      lang: 'no-known-lang'
    - script: alert('added to bottom from metadata');
headerStylesheetsAdd:
    - href: '/vendor/metadata-css-added.css'
    - href: '/vendor/metadata-css-with-media-added.css'
      media: 'print'
---

Testing Nunjucks function calls
