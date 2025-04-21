# Skate AMM Agent <> Goat SDK MCP Server

## Dependencies
1. model context protocol
2. goat sdk
3. skate sdk

## Usage
1. Install dependencies
```
npm install
```

2. Build Packages
```
npm run build
```

3. Add `.mcp.example.json` to `.mcp.json`

4. Start running mcp server


## Environment Variables
```bash
"WALLET_PRIVATE_KEY": "...",
# Private key of the wallet to use for transactions

"RPC_PROVIDER_URL": "...",
# RPC Provider URL for the chain to use for transactions (e.g. RPC for Base, Optimism, Arbitrum, etc.)

"CHAIN": "..."
# Corresponding chain ID for the chain to use for transactions (e.g. 42161, 8453 etc.)
```