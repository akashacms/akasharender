
import { promises as fsp } from 'fs';
import fs from 'fs';
import { documents, assets, layouts, partials } from './cache/file-cache.mjs';
import util from 'util';

export async function partial(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    // console.log(`partial ${fname}`);
    const found = partials.find(fname);
    if (!found) {
        throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);
    }
    // console.log(`partial ${fname} ==> ${found.vpath} ${found.fspath}`);

    /* No longer necessary to <code>stat</code> these files, because
     * DirsWatcher has already determined these are regular files.
     *
    let stats;
    try {
        stats = await fsp.stat(found.fspath);
    } catch (err) {
        throw new Error(`partial could not stat ${found.vpath} at ${found.fspath}`, err.stack);
    }
    if (!stats.isFile()) {
        throw new Error(`renderPartial non-file found for ${fname} - ${found.vpath}`);
    }
    */

    // console.log(`partial ${fname} ==> vpath ${found.vpath} fspath ${found.fspath}`);

    const renderer = config.findRendererPath(found.vpath);
    if (renderer) {
        // console.log(`partial about to render ${util.inspect(found.vpath)}`);
        let partialText = found.docContent
                ? found.docContent
                : await fsp.readFile(found.fspath, 'utf8');

        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        mdata.partialSync = partialSync.bind(renderer, config);
        mdata.partial     = partial.bind(renderer, config);
        return renderer.render(partialText, mdata, found);
    } else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        // console.log(`partial reading file ${found.vpath}`);
        return fsp.readFile(found.fspath, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${found.vpath}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialAsync(partial, attrs);
}

export function partialSync(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    const found = partials.find(fname);
    if (!found) new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);

    /* No longer necessary to <code>stat</code> these files, because
     * DirsWatcher has already determined these are regular files.
     *
    let stats;
    try {
        stats = fs.statSync(found.fspath);
    } catch (err) {
        throw new Error(`partialSync could not stat ${found.vpath} at ${found.fspath}`, err.stack);
    }
    if (!stats.isFile()) {
        throw new Error(`renderPartial non-file found for ${fname} - ${found.vpath}`);
    }
    */

    var renderer = config.findRendererPath(found.vpath);
    if (renderer) {
        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        mdata.partialSync = partialSync.bind(renderer, config);
        let partialText = found.docContent
                ? found.docContent
                : fs.readFileSync(found.fspath, 'utf8');
        return renderer.renderSync(partialText, mdata, found);
    } else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        return fs.readFileSync(found.fspath, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${found.vpath}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialSync(fname, metadata);
}
