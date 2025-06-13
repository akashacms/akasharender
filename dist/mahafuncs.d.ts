import { CustomElement as MahaCustomElement, ElementTweaker as MahaElementTweaker, Munger as MahaMunger, PageProcessor as MahaPageProcessor, Mahafunc as MahaMahafunc } from "mahabhuta";
import { Configuration, Plugin } from "./index.js";
export declare class Mahafunc extends MahaMahafunc {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class CustomElement extends MahaCustomElement {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class ElementTweaker extends MahaElementTweaker {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class Munger extends MahaMunger {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class PageProcessor extends MahaPageProcessor {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
//# sourceMappingURL=mahafuncs.d.ts.map