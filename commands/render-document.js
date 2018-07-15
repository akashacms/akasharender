
'use strict';

const path  = require('path');
const util  = require('util');
const cache = require('../caching');
const filez = require('../filez');

module.exports = (() => {
    const akasha = require('../index');
    const Command = require('cmnd').Command;

    class RenderSiteCommand extends Command {

        constructor() {
            super('render-document');
        }

        help() {
            return {
                description: 'Render a document into output directory',
                args: [ 'config_file', 'document' ],
            };
        }

        run(args, flags, vflags, callback) {

            const config = require(path.join(process.cwd(), args[0]));
            const documentPath = args[1];

            filez.findRendersTo(config.documentDirs, documentPath)
            .then(found => {
                return akasha.renderDocument(
                        config,
                        found.foundDir,
                        found.foundPathWithinDir,
                        config.renderTo,
                        found.foundMountedOn,
                        {});
            })
            .then(result => {
                console.log(result);
                callback(null, result);
            })
            .catch(err => {
                console.error(err.stack);
                callback(err);
            });
        }
    }

    return RenderSiteCommand;

})();
