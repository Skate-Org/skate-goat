import { arbitrum, base, mainnet, optimism } from "viem/chains";

export function getDynamicChain(chainId: number | string | undefined) {
    // Handle string inputs by parsing to number
    const chainIdNum = typeof chainId === "string" ? parseInt(chainId, 10) : chainId;

    switch (chainIdNum) {
        case 1:
            return mainnet;
        case 10:
            return optimism;
        case 42161:
            return arbitrum;
        case 8453:
            return base;
        // Add any additional chains as needed
        default:
            throw new Error(`CHAIN_ID:Chain id=${chainId} is not supported!`);
    }
}
