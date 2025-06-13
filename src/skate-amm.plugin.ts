import { PluginBase, Chain } from "@goat-sdk/core";
import { SkateAmmService } from "./skate-amm.service.js";

export class SkateAmmPlugin extends PluginBase {
    constructor() {
        super("SkateAmmPlugin", [new SkateAmmService()]);
    }

    supportsChain = (chain: Chain) => true;
}

export function SkateAmmPluginFactory() {
    return new SkateAmmPlugin();
}
