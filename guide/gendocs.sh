#!/bin/bash

export PATH=../node_modules/.bin:${PATH}

mkdir -p documents/api

cat <<EOF >documents/api/built-in.js.html.md
---
layout: docpage.html.ejs
title: Built-in Plugin
---
EOF
dox --api <../built-in.js >>documents/api/built-in.js.html.md

cat <<EOF >documents/api/caching.js.html.md
---
layout: docpage.html.ejs
title: Caching
---
EOF
dox --api <../caching.js >>documents/api/caching.js.html.md

cat <<EOF >documents/api/Configuration.js.html.md
---
layout: docpage.html.ejs
title: AkashaRender Configuration object
---
EOF
dox --api <../Configuration.js >>documents/api/Configuration.js.html.md

cat <<EOF >documents/api/documents.js.html.md
---
layout: docpage.html.ejs
title: Documents
---
EOF
dox --api <../documents.js >>documents/api/documents.js.html.md

cat <<EOF >documents/api/filez.js.html.md
---
layout: docpage.html.ejs
title: File-system operations
---
EOF
dox --api <../filez.js >>documents/api/filez.js.html.md

cat <<EOF >documents/api/HTMLRenderer.js.html.md
---
layout: docpage.html.ejs
title: HTML Renderer
---
EOF
dox --api <../HTMLRenderer.js >>documents/api/HTMLRenderer.js.html.md

cat <<EOF >documents/api/index.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer
---
EOF
dox --api <../index.js >>documents/api/index.js.html.md

cat <<EOF >documents/api/Plugin.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer Plugins
---
EOF
dox --api <../Plugin.js >>documents/api/Plugin.js.html.md

cat <<EOF >documents/api/render-cssless.js.html.md
---
layout: docpage.html.ejs
title: Rendering LESS files
---
EOF
dox --api <../render-cssless.js >>documents/api/render-cssless.js.html.md

cat <<EOF >documents/api/render-ejs.js.html.md
---
layout: docpage.html.ejs
title: Rendering EJS files
---
EOF
dox --api <../render-ejs.js >>documents/api/render-ejs.js.html.md

cat <<EOF >documents/api/render-md.js.html.md
---
layout: docpage.html.ejs
title: Rendering Markdown files
---
EOF
dox --api <../render-md.js >>documents/api/render-md.js.html.md

cat <<EOF >documents/api/render.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer rendering engine
---
EOF
dox --api <../render.js >>documents/api/render.js.html.md

cat <<EOF >documents/api/Renderer.js.html.md
---
layout: docpage.html.ejs
title: Renderer base class
---
EOF
dox --api <../Renderer.js >>documents/api/Renderer.js.html.md
