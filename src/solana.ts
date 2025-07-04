import { solana } from "@goat-sdk/wallet-solana";
import { getOnChainTools } from "@goat-sdk/adapter-model-context-protocol";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Connection, Keypair } from "@solana/web3.js";

import base58 from "bs58";
import { SkateAmmPluginFactory } from "./skate-amm.plugin.js";
import { splToken } from "@goat-sdk/plugin-spl-token";

// 1. Create the wallet client
const connection = new Connection(process.env.RPC_PROVIDER_URL as string);
const keypair = Keypair.fromSecretKey(base58.decode(process.env.WALLET_PRIVATE_KEY as string));

// 2. Get the onchain tools for the wallet
const toolsPromise = getOnChainTools({
    wallet: solana({
        keypair,
        connection,
    }),
    plugins: [SkateAmmPluginFactory(), splToken({
        "network": "mainnet",
        "tokens": [
            {
                decimals: 9,
                symbol: "SKATE",
                name: "SKATE",
                mintAddresses: {"mainnet": "9v6BKHg8WWKBPTGqLFQz87RxyaHHDygx8SnZEbBFmns2", "devnet": ""},
            }
        ]
    })],
});

// 3. Create and configure the server
const server = new Server(
    {
        name: "goat-solana",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    const { listOfTools } = await toolsPromise;
    return {
        tools: listOfTools(),
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { toolHandler } = await toolsPromise;
    try {
        return toolHandler(request.params.name, request.params.arguments);
    } catch (error) {
        throw new Error(`Tool ${request.params.name} failed: ${error}`);
    }
});

// 4. Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Skate AMM (SVM) <> GOAT MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
