/*
 * These classes simplify accessing the Configuration, Akasha, and
 * Plugin objects from Mahafuncs.
 *
 * Previously Mahafunc code had to gyrate through this.array.options.config
 * and this.array.options.config.akasha to get access to these
 * objects.
 *
 * These classes convert those to this.config and this.akasha and this.plugin
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Mahafunc_config, _Mahafunc_akasha, _Mahafunc_plugin, _CustomElement_config, _CustomElement_akasha, _CustomElement_plugin, _ElementTweaker_config, _ElementTweaker_akasha, _ElementTweaker_plugin, _Munger_config, _Munger_akasha, _Munger_plugin, _PageProcessor_config, _PageProcessor_akasha, _PageProcessor_plugin;
import { CustomElement as MahaCustomElement, ElementTweaker as MahaElementTweaker, Munger as MahaMunger, PageProcessor as MahaPageProcessor, Mahafunc as MahaMahafunc } from "mahabhuta";
export class Mahafunc extends MahaMahafunc {
    constructor(config, akasha, plugin) {
        super();
        _Mahafunc_config.set(this, void 0);
        _Mahafunc_akasha.set(this, void 0);
        _Mahafunc_plugin.set(this, void 0);
        __classPrivateFieldSet(this, _Mahafunc_config, config, "f");
        __classPrivateFieldSet(this, _Mahafunc_akasha, akasha, "f");
        __classPrivateFieldSet(this, _Mahafunc_plugin, plugin, "f");
    }
    get config() { return __classPrivateFieldGet(this, _Mahafunc_config, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _Mahafunc_akasha, "f"); }
    get plugin() { return __classPrivateFieldGet(this, _Mahafunc_plugin, "f"); }
}
_Mahafunc_config = new WeakMap(), _Mahafunc_akasha = new WeakMap(), _Mahafunc_plugin = new WeakMap();
export class CustomElement extends MahaCustomElement {
    constructor(config, akasha, plugin) {
        super();
        _CustomElement_config.set(this, void 0);
        _CustomElement_akasha.set(this, void 0);
        _CustomElement_plugin.set(this, void 0);
        __classPrivateFieldSet(this, _CustomElement_config, config, "f");
        __classPrivateFieldSet(this, _CustomElement_akasha, akasha, "f");
        __classPrivateFieldSet(this, _CustomElement_plugin, plugin, "f");
    }
    get config() { return __classPrivateFieldGet(this, _CustomElement_config, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _CustomElement_akasha, "f"); }
    get plugin() { return __classPrivateFieldGet(this, _CustomElement_plugin, "f"); }
}
_CustomElement_config = new WeakMap(), _CustomElement_akasha = new WeakMap(), _CustomElement_plugin = new WeakMap();
export class ElementTweaker extends MahaElementTweaker {
    constructor(config, akasha, plugin) {
        super();
        _ElementTweaker_config.set(this, void 0);
        _ElementTweaker_akasha.set(this, void 0);
        _ElementTweaker_plugin.set(this, void 0);
        __classPrivateFieldSet(this, _ElementTweaker_config, config, "f");
        __classPrivateFieldSet(this, _ElementTweaker_akasha, akasha, "f");
        __classPrivateFieldSet(this, _ElementTweaker_plugin, plugin, "f");
    }
    get config() { return __classPrivateFieldGet(this, _ElementTweaker_config, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _ElementTweaker_akasha, "f"); }
    get plugin() { return __classPrivateFieldGet(this, _ElementTweaker_plugin, "f"); }
}
_ElementTweaker_config = new WeakMap(), _ElementTweaker_akasha = new WeakMap(), _ElementTweaker_plugin = new WeakMap();
export class Munger extends MahaMunger {
    constructor(config, akasha, plugin) {
        super();
        _Munger_config.set(this, void 0);
        _Munger_akasha.set(this, void 0);
        _Munger_plugin.set(this, void 0);
        __classPrivateFieldSet(this, _Munger_config, config, "f");
        __classPrivateFieldSet(this, _Munger_akasha, akasha, "f");
        __classPrivateFieldSet(this, _Munger_plugin, plugin, "f");
    }
    get config() { return __classPrivateFieldGet(this, _Munger_config, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _Munger_akasha, "f"); }
    get plugin() { return __classPrivateFieldGet(this, _Munger_plugin, "f"); }
}
_Munger_config = new WeakMap(), _Munger_akasha = new WeakMap(), _Munger_plugin = new WeakMap();
export class PageProcessor extends MahaPageProcessor {
    constructor(config, akasha, plugin) {
        super();
        _PageProcessor_config.set(this, void 0);
        _PageProcessor_akasha.set(this, void 0);
        _PageProcessor_plugin.set(this, void 0);
        __classPrivateFieldSet(this, _PageProcessor_config, config, "f");
        __classPrivateFieldSet(this, _PageProcessor_akasha, akasha, "f");
        __classPrivateFieldSet(this, _PageProcessor_plugin, plugin, "f");
    }
    get config() { return __classPrivateFieldGet(this, _PageProcessor_config, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _PageProcessor_akasha, "f"); }
    get plugin() { return __classPrivateFieldGet(this, _PageProcessor_plugin, "f"); }
}
_PageProcessor_config = new WeakMap(), _PageProcessor_akasha = new WeakMap(), _PageProcessor_plugin = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFoYWZ1bmNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL21haGFmdW5jcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7QUFFSCxPQUFPLEVBQ0gsYUFBYSxJQUFJLGlCQUFpQixFQUNsQyxjQUFjLElBQUksa0JBQWtCLEVBQ3BDLE1BQU0sSUFBSSxVQUFVLEVBQ3BCLGFBQWEsSUFBSSxpQkFBaUIsRUFDbEMsUUFBUSxJQUFJLFlBQVksRUFDM0IsTUFBTSxXQUFXLENBQUM7QUFHbkIsTUFBTSxPQUFPLFFBQVMsU0FBUSxZQUFZO0lBS3RDLFlBQVksTUFBcUIsRUFBRSxNQUFXLEVBQUUsTUFBYztRQUMxRCxLQUFLLEVBQUUsQ0FBQztRQUxaLG1DQUF1QjtRQUN2QixtQ0FBYTtRQUNiLG1DQUFnQjtRQUlaLHVCQUFBLElBQUksb0JBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxvQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLG9CQUFXLE1BQU0sTUFBQSxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLE1BQU0sS0FBb0IsT0FBTyx1QkFBQSxJQUFJLHdCQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3BELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksd0JBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxNQUFNLEtBQW9CLE9BQU8sdUJBQUEsSUFBSSx3QkFBUSxDQUFDLENBQUMsQ0FBQztDQUN2RDs7QUFFRCxNQUFNLE9BQU8sYUFBYyxTQUFRLGlCQUFpQjtJQUtoRCxZQUFZLE1BQXFCLEVBQUUsTUFBVyxFQUFFLE1BQWM7UUFDMUQsS0FBSyxFQUFFLENBQUM7UUFMWix3Q0FBdUI7UUFDdkIsd0NBQWE7UUFDYix3Q0FBZ0I7UUFJWix1QkFBQSxJQUFJLHlCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUkseUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxNQUFNLEtBQW9CLE9BQU8sdUJBQUEsSUFBSSw2QkFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sS0FBb0IsT0FBTyx1QkFBQSxJQUFJLDZCQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3BELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksNkJBQVEsQ0FBQyxDQUFDLENBQUM7Q0FDdkQ7O0FBRUQsTUFBTSxPQUFPLGNBQWUsU0FBUSxrQkFBa0I7SUFLbEQsWUFBWSxNQUFxQixFQUFFLE1BQVcsRUFBRSxNQUFjO1FBQzFELEtBQUssRUFBRSxDQUFDO1FBTFoseUNBQXVCO1FBQ3ZCLHlDQUFhO1FBQ2IseUNBQWdCO1FBSVosdUJBQUEsSUFBSSwwQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLDBCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksMEJBQVcsTUFBTSxNQUFBLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksOEJBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxNQUFNLEtBQW9CLE9BQU8sdUJBQUEsSUFBSSw4QkFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sS0FBb0IsT0FBTyx1QkFBQSxJQUFJLDhCQUFRLENBQUMsQ0FBQyxDQUFDO0NBQ3ZEOztBQUVELE1BQU0sT0FBTyxNQUFPLFNBQVEsVUFBVTtJQUtsQyxZQUFZLE1BQXFCLEVBQUUsTUFBVyxFQUFFLE1BQWM7UUFDMUQsS0FBSyxFQUFFLENBQUM7UUFMWixpQ0FBdUI7UUFDdkIsaUNBQWE7UUFDYixpQ0FBZ0I7UUFJWix1QkFBQSxJQUFJLGtCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksa0JBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxrQkFBVyxNQUFNLE1BQUEsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxNQUFNLEtBQW9CLE9BQU8sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sS0FBb0IsT0FBTyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3BELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxDQUFDLENBQUM7Q0FDdkQ7O0FBRUQsTUFBTSxPQUFPLGFBQWMsU0FBUSxpQkFBaUI7SUFLaEQsWUFBWSxNQUFxQixFQUFFLE1BQVcsRUFBRSxNQUFjO1FBQzFELEtBQUssRUFBRSxDQUFDO1FBTFosd0NBQXVCO1FBQ3ZCLHdDQUFhO1FBQ2Isd0NBQWdCO1FBSVosdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLHlCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUkseUJBQVcsTUFBTSxNQUFBLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksNkJBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxNQUFNLEtBQW9CLE9BQU8sdUJBQUEsSUFBSSw2QkFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sS0FBb0IsT0FBTyx1QkFBQSxJQUFJLDZCQUFRLENBQUMsQ0FBQyxDQUFDO0NBQ3ZEIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKlxuICogVGhlc2UgY2xhc3NlcyBzaW1wbGlmeSBhY2Nlc3NpbmcgdGhlIENvbmZpZ3VyYXRpb24sIEFrYXNoYSwgYW5kXG4gKiBQbHVnaW4gb2JqZWN0cyBmcm9tIE1haGFmdW5jcy5cbiAqIFxuICogUHJldmlvdXNseSBNYWhhZnVuYyBjb2RlIGhhZCB0byBneXJhdGUgdGhyb3VnaCB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnXG4gKiBhbmQgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEgdG8gZ2V0IGFjY2VzcyB0byB0aGVzZVxuICogb2JqZWN0cy5cbiAqIFxuICogVGhlc2UgY2xhc3NlcyBjb252ZXJ0IHRob3NlIHRvIHRoaXMuY29uZmlnIGFuZCB0aGlzLmFrYXNoYSBhbmQgdGhpcy5wbHVnaW5cbiAqL1xuXG5pbXBvcnQge1xuICAgIEN1c3RvbUVsZW1lbnQgYXMgTWFoYUN1c3RvbUVsZW1lbnQsXG4gICAgRWxlbWVudFR3ZWFrZXIgYXMgTWFoYUVsZW1lbnRUd2Vha2VyLFxuICAgIE11bmdlciBhcyBNYWhhTXVuZ2VyLFxuICAgIFBhZ2VQcm9jZXNzb3IgYXMgTWFoYVBhZ2VQcm9jZXNzb3IsXG4gICAgTWFoYWZ1bmMgYXMgTWFoYU1haGFmdW5jXG59IGZyb20gXCJtYWhhYmh1dGFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIFBsdWdpbiB9IGZyb20gXCIuL2luZGV4LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBNYWhhZnVuYyBleHRlbmRzIE1haGFNYWhhZnVuYyB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI3BsdWdpbjogUGx1Z2luO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWd1cmF0aW9uLCBha2FzaGE6IGFueSwgcGx1Z2luOiBQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNha2FzaGEgPSBha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbiA9IHBsdWdpbjtcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCk6IENvbmZpZ3VyYXRpb24geyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IGFrYXNoYSgpOiBhbnkgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2FrYXNoYTsgfVxuICAgIGdldCBwbHVnaW4oKTogUGx1Z2luICAgICAgICB7IHJldHVybiB0aGlzLiNwbHVnaW47IH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1c3RvbUVsZW1lbnQgZXh0ZW5kcyBNYWhhQ3VzdG9tRWxlbWVudCB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI3BsdWdpbjogUGx1Z2luO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWd1cmF0aW9uLCBha2FzaGE6IGFueSwgcGx1Z2luOiBQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNha2FzaGEgPSBha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbiA9IHBsdWdpbjtcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCk6IENvbmZpZ3VyYXRpb24geyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IGFrYXNoYSgpOiBhbnkgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2FrYXNoYTsgfVxuICAgIGdldCBwbHVnaW4oKTogUGx1Z2luICAgICAgICB7IHJldHVybiB0aGlzLiNwbHVnaW47IH1cbn1cblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRUd2Vha2VyIGV4dGVuZHMgTWFoYUVsZW1lbnRUd2Vha2VyIHtcbiAgICAjY29uZmlnOiBDb25maWd1cmF0aW9uO1xuICAgICNha2FzaGE6IGFueTtcbiAgICAjcGx1Z2luOiBQbHVnaW47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZ3VyYXRpb24sIGFrYXNoYTogYW55LCBwbHVnaW46IFBsdWdpbikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI2FrYXNoYSA9IGFrYXNoYTtcbiAgICAgICAgdGhpcy4jcGx1Z2luID0gcGx1Z2luO1xuICAgIH1cblxuICAgIGdldCBjb25maWcoKTogQ29uZmlndXJhdGlvbiB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgYWthc2hhKCk6IGFueSAgICAgICAgICAgeyByZXR1cm4gdGhpcy4jYWthc2hhOyB9XG4gICAgZ2V0IHBsdWdpbigpOiBQbHVnaW4gICAgICAgIHsgcmV0dXJuIHRoaXMuI3BsdWdpbjsgfVxufVxuXG5leHBvcnQgY2xhc3MgTXVuZ2VyIGV4dGVuZHMgTWFoYU11bmdlciB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI3BsdWdpbjogUGx1Z2luO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWd1cmF0aW9uLCBha2FzaGE6IGFueSwgcGx1Z2luOiBQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNha2FzaGEgPSBha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbiA9IHBsdWdpbjtcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCk6IENvbmZpZ3VyYXRpb24geyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IGFrYXNoYSgpOiBhbnkgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2FrYXNoYTsgfVxuICAgIGdldCBwbHVnaW4oKTogUGx1Z2luICAgICAgICB7IHJldHVybiB0aGlzLiNwbHVnaW47IH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhZ2VQcm9jZXNzb3IgZXh0ZW5kcyBNYWhhUGFnZVByb2Nlc3NvciB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI3BsdWdpbjogUGx1Z2luO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWd1cmF0aW9uLCBha2FzaGE6IGFueSwgcGx1Z2luOiBQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNha2FzaGEgPSBha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbiA9IHBsdWdpbjtcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCk6IENvbmZpZ3VyYXRpb24geyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IGFrYXNoYSgpOiBhbnkgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2FrYXNoYTsgfVxuICAgIGdldCBwbHVnaW4oKTogUGx1Z2luICAgICAgICB7IHJldHVybiB0aGlzLiNwbHVnaW47IH1cbn1cblxuXG4iXX0=