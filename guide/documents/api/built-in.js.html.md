---
layout: docpage.html.ejs
title: Built-in Plugin
---
  - [undefined.if()](#undefinedif)
  - [undefined.if()](#undefinedif)
  - [new AnchorCleanup()](#newanchorcleanup)

## undefined.if()

  var keys = Object.keys(scripts);
```js
          for (var i = 0; i < keys.length; i++) {
          var style = scripts[keys[i]];
```

## undefined.if()

  var keys = Object.keys(scripts);
```js
  	for (var i = 0; i < keys.length; i++) {
  	    var script = scripts[keys[i]];
```

## new AnchorCleanup()

  This was moved into Mahabhuta
  
   class Partial extends mahabhuta.CustomElement {
  	get elementName() { return "partial"; }
  	process($element, metadata, dirty) {
  		// We default to making partial set the dirty flag.  But a user
  		// of the partial tag can choose to tell us it isn't dirty.
  		// For example, if the partial only substitutes normal tags
  		// there's no need to do the dirty thing.
  		var dothedirtything = $element.attr('dirty');
  		if (!dothedirtything || dothedirtything.match(/true/i)) {
  			dirty();
  		}
  		var fname = $element.attr("file-name");
  		var txt   = $element.html();
  		var d = {};
  		for (var mprop in metadata) { d[mprop] = metadata[mprop]; }
  		var data = $element.data();
  		for (var dprop in data) { d[dprop] = data[dprop]; }
  		d["partialBody"] = txt;
  		log('partial tag fname='+ fname +' attrs '+ util.inspect(data));
  		return akasha.partial(metadata.config, fname, d)
  		.then(html => { return html; })
  		.catch(err => {
  			error(new Error("FAIL partial file-name="+ fname +" because "+ err));
  			throw new Error("FAIL partial file-name="+ fname +" because "+ err);
  		});
  	}
  }
  module.exports.mahabhuta.addMahafunc(new Partial());
