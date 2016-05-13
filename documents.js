
This is meant to replace the Entry thingy in AkashaCMS

That object incorporated known data about each Document

/**
 * This might be a base class with several other classes depending on file extension.
 */
module.exports.Document = class Document {
    
};

module.exports.TextDocument = class TextDocument extends Document {
    
};

module.exports.ImageDocument = class ImageDocument extends Document {
    
};
