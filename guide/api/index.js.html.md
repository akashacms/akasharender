---
layout: docpage.html.ejs
title: AkashaRenderer
---
  - [exports.Configuration](#exportsconfiguration)
  - [exports.findRendersTo](#exportsfindrendersto)
  - [exports.readFile](#exportsreadfile)

## exports.Configuration

  The AkashaRender project configuration object.  One instantiates a Configuration
  object, then fills it with settings and plugins.

## exports.findRendersTo

  Finds the source document matching the filename for a rendered file.  That is, for
  a rendered file path like {movies/wallachia/vlad-tepes/son-of-dracul.html} it will search
  for the {.html.md} file generating that rendered file.
  
  The returned object has at least these fields:
  
  * {foundDir} - The basedir within which the file was found
  * {foundPath} - The path under basedir to that file
  * {foundFullPath} - The path, including the full file extension, to that file
  * {foundMountedOn} - For complex directories, the path  this directory is mounted on .. e.g. dir.dest
  * {foundPathWithinDir} - For complex directories, the path within that directory.
  * {foundBaseMetadata} - For complex directories, the metadata associated with that directory

## exports.readFile

  
