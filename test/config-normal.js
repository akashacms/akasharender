
// This is meant to test using a CommonJS configuration file with AkashaRender.
// Problems seen on Node.js 24.2:
//
// Using require - require() cannot be used on an ESM graph with top-level await.
// This is documented in the Node.js online manuals.  Many modules in
// AkashaRender do have top-level await
//
// Using import - SyntaxError: Unexpected token 'import'
// In this case the printed error points at the import() call here.
// I don't understand this, since import() is supposed to be available
// on Node.js 24 CommonJS modules.
//
// Bottom line is that CommonJS format Config files can no longer be supported.
//
// In package.json, the two targets test-copy-render-js and build:copy-render-js
// will fail because of the above issues.  Those targets will continue to exist,
// but will not be executed as part of the test target.

const akasha   = (await import('../dist/index.js')).default; // require('../dist/index.js'); // (await import('../dist/index.js')).default;
const mahabhuta = akasha.mahabhuta;

// const __dirname = import.meta.dirname;

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

(await import('./final-mahabhuta.js'))
// (require('./final-mahabhuta.js'))
    .default.addFinalMahabhuta(config, mahabhuta);

module.exports = config;

// console.log(config);