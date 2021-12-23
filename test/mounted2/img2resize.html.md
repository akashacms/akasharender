---
title: Testing images in a mounted document directory
layout: default-once.html.ejs
---

THIS IS THE OVERRIDING VERSION OF img2resize

This image should be left alone

<img id="no-change" src="img/Human-Skeleton.jpg">

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

This tests resizing an image from a mounted directory

<img id="mountedimg" src="/mounted/img/Human-Skeleton.jpg" 
    resize-width="100" resize-to="img/Human-Skeleton-mounted-100.jpg">


This tests resizing an image from a mounted directory

<img id="mountedimg2nonmounted" src="/mounted/img/Human-Skeleton.jpg" 
    resize-width="100" resize-to="/img/Human-Skeleton-from-mounted-to-img-100.jpg">