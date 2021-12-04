
const akasha   = require('../index');
const mahabhuta = akasha.mahabhuta;

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

require('./final-mahabhuta.js').addFinalMahabhuta(config, mahabhuta);

module.exports = config;
