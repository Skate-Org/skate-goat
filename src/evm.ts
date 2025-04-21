// @ts-nocheck
import { getOnChainTools } from "@goat-sdk/adapter-model-context-protocol";
import { viem } from "@goat-sdk/wallet-viem";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {SkateAmmPluginFactory} from "./skate-amm.plugin.js";
import { getDynamicChain } from "./lib/index.js";

import "mcps-logger/console";


// *********** Skate Specific Client Setup ***********
// Select Chain for wallet client
const chainId = process.env.CHAIN
const dynamicChain = getDynamicChain(chainId);

// Create a wallet client
const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account: account,
  transport: http(process.env.RPC_PROVIDER_URL as string),
  chain: dynamicChain
})

// Get the onchain tools for the wallet
const toolsPromise = getOnChainTools({
  wallet: viem(walletClient),
  plugins: [SkateAmmPluginFactory()],
});

// Create server instance
const server = new Server(
  {
      name: "goat-evm",
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
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { toolHandler } = await toolsPromise;
  try {
      return toolHandler(request.params.name, request.params.arguments);
  } catch (error) {
    console.log(error);
      throw new Error(`Tool ${request.params.name} failed: ${error}`);
  }
});

// 4. Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skate AMM <> GOAT MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
