

const akasha   = (await import('../dist/index.js')).default;
const mahabhuta = akasha.mahabhuta;

const __dirname = import.meta.dirname;

const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config
    .addAssetsDir({
        src: 'assets2',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addAssetsDir({
        src: 'assets',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addLayoutsDir({
        src: 'layouts',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addLayoutsDir({
        src: 'layouts-extra',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addDocumentsDir({
        src: 'documents',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addDocumentsDir({
        src: 'mounted',
        dest: 'mounted',
        ignore: [
            '**/.placeholder'
        ]
    })
    .addDocumentsDir({
        src: '../guide',
        dest: 'guide'
    })
    .addPartialsDir({
        src: 'partials',
        dest: '/',
        ignore: [
            '**/.placeholder'
        ]
    });
config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    decodeEntities: true
});
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ 
        href: "/vendor/popper.js/umd/popper.min.js",
        lang: 'no-known-lang'
    })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js" })
    .addHeaderJavaScript({ href: "/vendor/header-js.js"})
    .addHeaderJavaScript({ 
        href: "/vendor/popper.js/popper.min.js",
        lang: 'no-known-lang'
    })
    .addHeaderJavaScript({
        script: "alert('in header with inline script');"
    })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/style.css" })
    .addStylesheet({ href: "/print.css", media: "print" });
config.setConcurrency(5);
config.prepare();

// (await import('./final-mahabhuta.js'))
//     .default.addFinalMahabhuta(config, mahabhuta);

export default config;

// console.log(config);

import {
    setup, closeFileCaches, assetsCache,
    partialsCache,
    layoutsCache,
    documentsCache,
    documentsDAO
} from '../dist/cache/file-cache-sqlite.js';

await setup(config);

await assetsCache.isReady();
// console.log(await assetsCache.paths());

await partialsCache.isReady();
// console.log(await partialsCache.paths());

await layoutsCache.isReady();
// console.log(await layoutsCache.paths());

await documentsCache.isReady();
// console.log(await documentsCache.paths());
// const paths = await documentsCache.paths();
// const res = await documentsDAO.sqldb.all(`
//     SelECT
//         vpath, renderPath
//     FROM DOCUMENTS
//     WHERE renderPath regexp '/index.html$'
// `);

// console.log(res);

// const res2 = await documentsDAO.selectAll({
//     or: [
//         { sql: '  vpath regexp \'.*anchor.*\' ' },
//         { sql: '  renderPath regexp \'/index.html$\'  ' }
//     ]
// });
// console.log(res2.map(item => {
//     return { vpath: item.vpath }
// }));

try {
    const docs = await documentsCache.search({
        rendersToHTML: true,
        rootPath: 'hier',
        layouts: [ 'default.html.ejs', 'njkincl.html.njk' ]
    });
    // const docs = await documentsCache.dao.selectAll(
    //     {
    //         and: [
    //             { rendersToHTML: { eq: true } },
    //             // { renderPath: { isLike: 'hier/%' } },
    //             { or: [ 
    //                 { layout: { eq: 'default.html.ejs' } },
    //                 { layout: { eq: 'default-once.html.ejs' } },
    //                 { layout: { eq: 'njkincl.html.njk' } } ]
    //             }
    //         ]
    //     }
    // );
    console.log(docs.map(doc => {
        return {
            vpath: doc.vpath,
            renderPath: doc.renderPath,
            rendersToHTML: doc.rendersToHTML,
            layout: doc.docMetadata.layout
        }
    }));
} catch (err) {
    console.error(err.stack);
}

await closeFileCaches();
