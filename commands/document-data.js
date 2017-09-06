
'use strict';

const path  = require('path');
const util  = require('util');
const cache = require('../caching');

module.exports = (() => {
    const akasha = require('../index');
    const Command = require('cmnd').Command;

    class DocumentDataCommand extends Command {

        constructor() {
            super('document');
        }

        help() {
            return {
                description: 'Show information about a document',
                args: [ 'config_file', 'document' ],
            };
        }

        run(args, flags, vflags, callback) {

            const config = require(path.join(process.cwd(), args[0]));
            const docfile = args[1];
            akasha.readDocument(config, docfile)
            .then(doc => {
                console.log(`
basedir: ${doc.basedir}
docpath: ${doc.docpath}
fullpath: ${doc.fullpath}
renderer: ${util.inspect(doc.renderer)}
renderpath: ${doc.renderpath}

data: ${doc.data}

metadata: ${util.inspect(doc.metadata)}

text: ${doc.text}


`)
                callback(null);
            })
            .catch(err => {
                callback(err);
            });

        }
    }

    return DocumentDataCommand;

})();
