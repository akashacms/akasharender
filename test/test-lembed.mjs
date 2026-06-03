
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import * as sqlite_regex  from "sqlite-regex";
import * as sqlite_vec    from 'sqlite-vec';
import * as sqlite_lembed from 'sqlite-lembed';

import { AsyncDatabase } from 'promised-sqlite3';

const sqdb = await AsyncDatabase.open('test-lembed.db');

sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());
sqlite_lembed.load(sqdb.inner);
sqlite_vec.load(sqdb.inner);

const fulltest = false;

const lembedModelFile = '/home/david/Projects/akasharender/akasharender/test/all-MiniLM-L6-v2.e4ce9877.q8_0.gguf';
const lembedModelName = 'all-MiniLM-L6-v2';

// const lembedModelFile = '/home/david/Projects/akasharender/akasharender/test/nomic-embed-text-v1.5.Q8_0.gguf';
// const lembedModelName = 'nomic-embed-text-v1.5';


await sqdb.run(`
    INSERT INTO temp.lembed_models(name, model)
    select ?, lembed_model_from_file(?);
`, [
    lembedModelName,
    lembedModelFile
]);

await sqdb.run('PRAGMA journal_mode=WAL;');

sqdb.inner.on('error', err => {
    console.error(err);
});

await sqdb.run(`
CREATE TABLE IF NOT EXISTS documents (
    path TEXT,
    body TEXT
);  
`);
await sqdb.run(`
CREATE VIRTUAL TABLE IF NOT EXISTS vec_documents USING vec0(
        vpath TEXT,
        body_embeddings  FLOAT[384]
);    
`);

const doclist = await fsp.readFile('./docfiles.txt', 'utf-8');
const docs = doclist.split('\n');

for (const doc of docs) {
    console.log(doc);
    if (doc.endsWith('asciidoctor-handlebars.html.adoc')
     || doc.endsWith('asciidoctor-nunjucks.html.adoc')
     || doc.endsWith('asciidoctor.html.adoc')
     || doc.endsWith('asciidoctor-liquid.html.adoc')
     || doc.endsWith('style.css.less')
     || doc.endsWith('select-elements.html.md')
     || doc === '') {
        console.log(`... skipping ${doc}`);
        continue;
    }
    const DOCTXT = await fsp.readFile(doc, 'utf-8');

    if (fulltest === true) {
        await sqdb.run(`
        INSERT INTO documents ( path, body ) VALUES (?, ?);
        `, [ path, DOCTXT ]);
        // console.log(`after INSERT INTO documents`);
        await sqdb.run(`
        INSERT INTO vec_documents ( vpath, body_embeddings ) VALUES (
            ?, lembed(?, ?)
        );
        `, [ path, lembedModelName, DOCTXT ]);
    } else {
        await sqdb.run(`
        SELECT lembed(?, ?);
        `, [ lembedModelName, DOCTXT ]);
    }
    // console.log(`after INSERT INTO vec_documents`);
}

await sqdb.close();
