---
title: Converting image to figure/image test
layout: default-once.html.liquid
publicationDate: 2021-10-24
---

This image should be left alone

<img id="no-change" src="img/Human-Skeleton.jpg">

These images should be converted

<img id="change1" figure src="img/Human-Skeleton.jpg">

<img id="change-class"
    class="some-class"
    figure
    src="img/Human-Skeleton.jpg">

<img id="change-caption" 
    figure
    src="img/Human-Skeleton.jpg"
    caption="This is a caption">

<img id="change-dest"
    figure
    src="img/Human-Skeleton.jpg"
    dest="https://somewhere.else">
