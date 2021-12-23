// This config file is for testing badly formatted documents
// The documents-bad directory should only contain documents with bad formatting

const akasha   = require('../index');

config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config
    .addAssetsDir({
        src: 'assets',
        dest: '/',
    })
    .addLayoutsDir({
        src: 'layouts',
        dest: '/',
    })
    .addDocumentsDir({
        src: 'documents-bad',
        dest: '/'
    })
    .addPartialsDir({
        src: 'partials',
        dest: '/'
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
    .addStylesheet({       href: "/style.css" })
    .addStylesheet({       href: "/print.css", media: "print" });
config.setConcurrency(5);
config.prepare();

module.exports = config;
