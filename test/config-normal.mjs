
const akasha   = (await import('../dist/index.js')).default;
const mahabhuta = akasha.mahabhuta;

const __dirname = import.meta.dirname;

const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
// config.verbose = true;
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
    .addHeaderJavaScript({ href: "/vendor/header-js.js"})
    .addHeaderJavaScript({
        script: "alert('in header with inline script');"
    })
    .addStylesheet({ href: "/style.css" })
    .addStylesheet({ href: "/print.css", media: "print" });
config.setConcurrency(5);
config.prepare();

(await import('./final-mahabhuta.js'))
    .default.addFinalMahabhuta(config, mahabhuta);

export default config;

// console.log(config);