
module.exports.addFinalMahabhuta = function(config, mahabhuta) {

    // This is a mahabhuta function that runs at the very end
    // so that we can validate whether the final mahafuncs run.
    // It adds a known attribute to the <body> tag.
    const final_array = new mahabhuta.MahafuncArray("config-normal", {});
    class AddToBodyFinal extends mahabhuta.Munger {
        get selector() { return 'html body'; }
        get elementName() { return 'html body'; }
        async process($, $element, metadata, dirty, done) {
            // console.log($element);
            $element.attr('final', 'ran');
        }
    }
    final_array.addFinalMahafunc(new AddToBodyFinal());
    config.addMahabhuta(final_array);
    return config;
}
