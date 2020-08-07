---
title: Converting image to figure/image test
layout: default-once.html.liquid
---

This image should be left alone

<img id="no-change" src="img/Human-Skeleton.jpg">

This image should be resized to 50px

<img id="resizeto50" resize-width="50" src="img/Human-Skeleton.jpg">

This image should be resized to 150px, to a new file name, and `<img src>` attribute rewritten

<img id="resizeto150" 
        src="img/Human-Skeleton.jpg"
        resize-width="150"
        resize-to="img/Human-Skeleton-150.jpg">

This image should be encased in a `<figure>`, with a `<figcaption>`, resized to 150px, and new file name

<img id="resizeto250figure" 
        figure
        src="img/Human-Skeleton.jpg"
        resize-width="250"
        resize-to="img/Human-Skeleton-250-figure.jpg"
        caption="Image caption">

This tests an image in an assets directory

<img id="resizerss" src="rss_button.png" resize-width="50">

This tests converting an image from PNG to JPEG

<img id="png2jpg"  src="rss_button.png" resize-width="50" resize-to="rss_button.jpg">

This tests resizing an image from a mounted directory

<img id="mountedimg" src="/mounted/img/Human-Skeleton.jpg" 
    resize-width="100" resize-to="/img/Human-Skeleton-mounted-100.jpg">