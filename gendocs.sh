#!/bin/bash

export PATH=../node_modules/.bin:${PATH}

mkdir -p guide/api

cat <<EOF >guide/api/built-in.js.html.md
---
layout: plugin-documentation.html.ejs
title: Built-in Plugin
---
EOF
dox --api <../built-in.js >>guide/api/built-in.js.html.md

cat <<EOF >documents/api/caching.js.html.md
---
layout: plugin-documentation.html.ejs
title: Caching
---
EOF
dox --api <../caching.js >>guide/api/caching.js.html.md

cat <<EOF >guide/api/Configuration.js.html.md
---
layout: plugin-documentation.html.ejs
title: AkashaRender Configuration object
---
EOF
dox --api <../Configuration.js >>guide/api/Configuration.js.html.md

cat <<EOF >guide/api/HTMLRenderer.js.html.md
---
layout: plugin-documentation.html.ejs
title: HTML Renderer
---
EOF
dox --api <../HTMLRenderer.js >>guide/api/HTMLRenderer.js.html.md

cat <<EOF >guide/api/index.js.html.md
---
layout: plugin-documentation.html.ejs
title: AkashaRenderer
---
EOF
dox --api <../index.js >>guide/api/index.js.html.md

cat <<EOF >guide/api/Plugin.js.html.md
---
layout: plugin-documentation.html.ejs
title: AkashaRenderer Plugins
---
EOF
dox --api <../Plugin.js >>guide/api/Plugin.js.html.md

cat <<EOF >guide/api/render-cssless.js.html.md
---
layout: plugin-documentation.html.ejs
title: Rendering LESS files
---
EOF
dox --api <../render-cssless.js >>guide/api/render-cssless.js.html.md

cat <<EOF >guide/api/render-ejs.js.html.md
---
layout: plugin-documentation.html.ejs
title: Rendering EJS files
---
EOF
dox --api <../render-ejs.js >>guide/api/render-ejs.js.html.md

cat <<EOF >guide/api/render-md.js.html.md
---
layout: plugin-documentation.html.ejs
title: Rendering Markdown files
---
EOF
dox --api <../render-md.js >>guide/api/render-md.js.html.md

cat <<EOF >guide/api/render.js.html.md
---
layout: plugin-documentation.html.ejs
title: AkashaRenderer rendering engine
---
EOF
dox --api <../render.js >>guide/api/render.js.html.md

cat <<EOF >guide/api/Renderer.js.html.md
---
layout: plugin-documentation.html.ejs
title: Renderer base class
---
EOF
dox --api <../Renderer.js >>guide/api/Renderer.js.html.md
