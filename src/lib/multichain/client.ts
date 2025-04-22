import { CHAIN } from "@skate-org/skate-app-amm";
import {
    Account,
    Chain,
    createPublicClient,
    createWalletClient,
    http,
    PrivateKeyAccount,
    PublicClient,
    Transport,
    WalletClient,
} from "viem";
import { arbitrum, base, mainnet, optimism } from "viem/chains";

// ************** Chain Definitions **************
const baseChain = base;
const arbitrumChain = arbitrum;
const optimismChain = optimism;
const ethereumChain = mainnet;

// ************** RPC Definitions **************
const baseTransport = http(process.env.BASE_RPC_URL);
const arbitrumTransport = http(process.env.ARBITRUM_RPC_URL);
const optimismTransport = http(process.env.OPTIMISM_RPC_URL);
const ethereumTransport = http(process.env.ETHEREUM_RPC_URL);

// ************** Client Definitions **************
export const baseClient = createPublicClient({
    chain: baseChain,
    transport: baseTransport,
});

export const arbitrumClient = createPublicClient({
    chain: arbitrumChain,
    transport: arbitrumTransport,
});

export const optimismClient = createPublicClient({
    chain: optimismChain,
    transport: optimismTransport,
});

export const ethereumClient = createPublicClient({
    chain: ethereumChain,
    transport: ethereumTransport,
});

export function getPublicClient(chain: CHAIN): PublicClient<Transport, Chain> {
    switch (chain) {
        case CHAIN.BASE:
            return baseClient as PublicClient<Transport, Chain>;
        case CHAIN.ARBITRUM:
            return arbitrumClient as PublicClient<Transport, Chain>;
        case CHAIN.OPTIMISM:
            return optimismClient as PublicClient<Transport, Chain>;
        case CHAIN.ETHEREUM:
            return ethereumClient as PublicClient<Transport, Chain>;
        default:
            throw new Error(`PERIPHERY_CLIENT_INFO:Chain id=${chain} is not supported!`);
    }
}

export function getWalletClient(chain: CHAIN, account: PrivateKeyAccount): WalletClient<Transport, Chain, Account> {
    switch (chain) {
        case CHAIN.BASE:
            return createWalletClient({
                chain: baseChain,
                transport: baseTransport,
                account,
            });
        case CHAIN.ARBITRUM:
            return createWalletClient({
                chain: arbitrumChain,
                transport: arbitrumTransport,
                account,
            });
        case CHAIN.OPTIMISM:
            return createWalletClient({
                chain: optimismChain,
                transport: optimismTransport,
                account,
            });
        case CHAIN.ETHEREUM:
            return createWalletClient({
                chain: mainnet,
                transport: ethereumTransport,
                account,
            });
        default:
            throw new Error(`PERIPHERY_CLIENT_INFO:Chain id=${chain} is not supported!`);
    }
}
