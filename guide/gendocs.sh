#!/bin/bash

export PATH=../node_modules/.bin:${PATH}

cat <<EOF >documents/built-in.js.html.md
---
layout: docpage.html.ejs
title: Built-in Plugin
---
EOF
dox --api <../built-in.js >>documents/built-in.js.html.md

cat <<EOF >documents/caching.js.html.md
---
layout: docpage.html.ejs
title: Caching
---
EOF
dox --api <../caching.js >>documents/caching.js.html.md

cat <<EOF >documents/Configuration.js.html.md
---
layout: docpage.html.ejs
title: AkashaRender Configuration object
---
EOF
dox --api <../Configuration.js >>documents/Configuration.js.html.md

cat <<EOF >documents/documents.js.html.md
---
layout: docpage.html.ejs
title: Documents
---
EOF
dox --api <../documents.js >>documents/documents.js.html.md

cat <<EOF >documents/filez.js.html.md
---
layout: docpage.html.ejs
title: File-system operations
---
EOF
dox --api <../filez.js >>documents/filez.js.html.md

cat <<EOF >documents/HTMLRenderer.js.html.md
---
layout: docpage.html.ejs
title: HTML Renderer
---
EOF
dox --api <../HTMLRenderer.js >>documents/HTMLRenderer.js.html.md

cat <<EOF >documents/index.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer
---
EOF
dox --api <../index.js >>documents/index.js.html.md

cat <<EOF >documents/Plugin.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer Plugins
---
EOF
dox --api <../Plugin.js >>documents/Plugin.js.html.md

cat <<EOF >documents/render-cssless.js.html.md
---
layout: docpage.html.ejs
title: Rendering LESS files
---
EOF
dox --api <../render-cssless.js >>documents/render-cssless.js.html.md

cat <<EOF >documents/render-ejs.js.html.md
---
layout: docpage.html.ejs
title: Rendering EJS files
---
EOF
dox --api <../render-ejs.js >>documents/render-ejs.js.html.md

cat <<EOF >documents/render-md.js.html.md
---
layout: docpage.html.ejs
title: Rendering Markdown files
---
EOF
dox --api <../render-md.js >>documents/render-md.js.html.md

cat <<EOF >documents/render.js.html.md
---
layout: docpage.html.ejs
title: AkashaRenderer rendering engine
---
EOF
dox --api <../render.js >>documents/render.js.html.md

cat <<EOF >documents/Renderer.js.html.md
---
layout: docpage.html.ejs
title: Renderer base class
---
EOF
dox --api <../Renderer.js >>documents/Renderer.js.html.md
