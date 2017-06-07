
'use strict';

const path  = require('path');
const util  = require('util');
const cache = require('../caching');

module.exports = (() => {
    const akasha = require('../index');
    const Command = require('cmnd').Command;

    class RenderSiteCommand extends Command {

        constructor() {
            super('render');
        }

        help() {
            return {
                description: 'Render a site into output directory',
                args: [ 'config_file' ],
            };
        }

        run(args, flags, vflags, callback) {

            const config = require(path.join(process.cwd(), args[0]));

            akasha.render(config)
            .then(results => {
                for (let result of results) {

                    // TODO --- if AKASHARENDER_TRACE_RENDER then output tracing data
                    // TODO --- also set process.env.GLOBFS_TRACE=1

                    if (result.error) {
                        console.error(result.error);
                    } else {
                        console.log(result.result);
                        // console.log(util.inspect(result.result));
                    }
                }
                // console.log(`Caching Stats: ${util.inspect(cache.getStats())}`)
                callback(null);
            })
            .catch(err => { callback(err); });

        }
    }

    return RenderSiteCommand;

})();
