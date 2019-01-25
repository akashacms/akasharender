
'use strict';

const path = require('path');

module.exports = (() => {
    // const akasha = require('../index');
    const Command = require('cmnd').Command;
    
    class CopyAssetsCommand extends Command {
    
        constructor() {
            super('copy-assets');
        }
      
        help() {
            return {
                description: 'Copy assets into output directory',
                args: [ 'config_file' ],
            };
        }
        
        run(args, flags, vflags, callback) {
            
            const config = require(path.join(__dirname, args[0]));

            config.copyAssets()
            .then(() => { callback(null); })
            .catch(err => { callback(err); });
    
        }
    }

    return CopyAssetsCommand;

})();