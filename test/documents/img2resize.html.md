---
title: Converting image to figure/image test
layout: default-once.html.ejs
---

This image should be left alone

<img id="no-change" src="img/Human-Skeleton.jpg">

These images should be converted

<img id="resizeto50" resize-width="50" src="img/Human-Skeleton.jpg"
        resize-to="img/Human-Skeleton-50.jpg">

<img id="resizeto150" 
        src="img/Human-Skeleton.jpg"
        resize-width="150"
        resize-to="img/Human-Skeleton-150.jpg">

<img id="resizeto250figure" 
        figure
        src="img/Human-Skeleton.jpg"
        resize-width="250"
        resize-to="img/Human-Skeleton-250-figure.jpg">
