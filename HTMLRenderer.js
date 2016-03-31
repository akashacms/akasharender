'use strict';

const Renderer  = require('./Renderer');
const render    = require('./render');
const fs        = require('fs-extra');
const path      = require('path');
const util      = require('util');
const yfm       = require('yfm');
const mahabhuta = require('mahabhuta');
const filez     = require('./filez');

const log   = require('debug')('akasha:HTMLRenderer');
const error = require('debug')('akasha:error');

module.exports = class HTMLRenderer extends Renderer {
    
    maharun(rendered, metadata, mahafuncs) {
        return new Promise((resolve, reject) => {
            if (metadata.config.cheerio) mahabhuta.config(metadata.config.cheerio);
            mahabhuta.process(rendered, metadata, mahafuncs, (err, rendered) => {
                if (err) reject(err);
                else resolve(rendered);
            });
        });
    }
    
    copyMetadataProperties(data, frontmatter) {
        for (var prop in frontmatter) {
            if (!(prop in data)) data[prop] = frontmatter[prop];
        }
        return data;
    }
    
    renderForLayout(rendered, metadata, config) {
        if (metadata.layout) {
            // find layout
            // read layout
            // split out frontmatter & content
            // find renderer
            // renderer.render 
            // mahabhuta
            
            var fnLayout
            var layouttext;
            var layoutcontent;
            var layoutdata;
            var layoutrendered;
            
            return filez.find(config.layoutDirs, metadata.layout)
            .then(foundDir => filez.readFile(foundDir, metadata.layout))
            .then(layout => {
                layouttext = layout;
                var fm = yfm(layout);
                layoutcontent = fm.content;
                layoutdata    = this.copyMetadataProperties(metadata, fm.context);
                layoutdata.content = rendered;
                const renderer = render.findRendererPath(metadata.layout);
                if (!renderer) throw new Error(`No renderer for ${fnLayout}`);
                return renderer.render(layoutcontent, layoutdata);
            })
            .then(_rendered => {
                layoutrendered = _rendered;
                // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
                return this.maharun(layoutrendered, layoutdata, config.mahafuncs);
            })
            .then(_rendered => {
                layoutrendered = _rendered;
                // POTENTIAL IDEA - to support a chain of layouts
                // At this point, check layoutdata.layout and if set
                //     return renderForLayout(layoutrendered, layoutdata, layoutDirs, partialDirs)
                // otherwise this
                return layoutrendered;
            });
            
        } else return Promise.resolve(rendered);
    }
    
    renderToFile(basedir, fpath, metadata, config) {
        
        var doctext;
        var doccontent;
        var docdata;
        var docrendered;
        
        metadata = this.addMetadataFunctions(metadata, config);
    
        return filez.readFile(basedir, fpath)
        .then(text => {
            // TODO add in other metadata if needed
            var fm = yfm(text);
            doctext = text;
            doccontent = fm.content;
            docdata    = this.copyMetadataProperties(metadata, fm.context);
            log('about to render '+ fpath);
            return this.render(doccontent, docdata);
        })
        .then(rendered => {
            docrendered = rendered;
            log('rendered to maharun '+ fpath);
            return this.maharun(rendered, docdata, config.mahafuncs);
        })
        .then(rendered => {
            docrendered = rendered;
            log('maharun to renderForLayout '+ fpath);
            return this.renderForLayout(docrendered, docdata, config);
        })
        .then(rendered => filez.writeFile(config.renderTo, this.filePath(fpath), rendered));
    }
    
    // Should partial and partialSync be hosted by this class instead of render.js?
    addMetadataFunctions(metadata, config) {
        metadata.config      = config;
        metadata.partialSync = render.partialSync.bind(this, config);
        metadata.partial     = render.partial.bind(this, config);
        return metadata;
    }
    
}