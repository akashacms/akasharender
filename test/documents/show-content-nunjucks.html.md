---
layout: default-once.html.njk
title: Show Content
publicationDate: 2021-11-15
---

<show-content id="simple" href="/shown-content.html"></show-content>

<show-content id="dest" dest="http://dest.url" href="/shown-content.html"></show-content>


<show-content id="template" 
        template="ak_show-content-card.html.ejs" 
        href="/shown-content.html"
        content-image="/imgz/shown-content-image.jpg"
        >
        Caption text
        </show-content>

<show-content id="template2" 
        template="ak_show-content-card.html.ejs" 
        href="/shown-content.html"
         dest="http://dest.url"
        content-image="/imgz/shown-content-image.jpg"
        >
        Caption text
        </show-content>

