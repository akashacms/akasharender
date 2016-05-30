
'use strict';

const path = require('path');

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
                    if (result.error) {
                        console.error(result.error);
                    } else {
                        console.log(result.result);
                    }
                }
                callback(null);
            })
            .catch(err => { callback(err); });
    
        }
    }

    return RenderSiteCommand;

})();