// @ts-nocheck
import { Tool } from "@goat-sdk/core";
import { ViemEVMWalletClient } from "@goat-sdk/wallet-viem";
import { SolanaKeypairWalletClient, SolanaWalletClient } from "@goat-sdk/wallet-solana";
import {
    EmptyParameters,
    KernelPoolParameters,
    SetTokenApprovalParameters,
    SwapQuoteParameters,
    TokenApprovalParameters,
    UserWalletParameters,
    ERC20BalanceParameters,
    SPLTokenBalanceParameters
} from "./parameters.js";
import {
    getAllPoolInfo,
    getSlot0,
    getUserPositions,
    getSwapQuote,
    PoolKey,
    apiGetSwapQuote,
    skateAdapter,
    ApiSwapQuoteResultSVM
} from "@skate-org/skate-app-amm";
import { createPublicClient, defineChain, http, parseUnits, formatUnits } from "viem";
import { giveMeSwapQuote } from "./test.js";
import { getPublicClient, getWalletClient } from "./lib/multichain/client.js";
import { PublicKey } from "@solana/web3.js";

const skateChain = defineChain({
    id: 5051,
    name: "Skate",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.skatechain.org"],
        },
    },
    blockExplorers: {},
    contracts: {},
});

const SkatePublicClient = createPublicClient({
    chain: skateChain,
    transport: http("https://rpc.skatechain.org"),
    pollingInterval: 1000,
});

export class SkateAmmService {
    @Tool({
        description: "Retrieves all markets supported by the Skate AMM. Chain ID 901 is Solana, Chain ID 902 is Eclipse. The rest are EVM chains.",
    })
    async getTradingPairs(parameters: EmptyParameters) {
        const allPoolInfo = await getAllPoolInfo("PRODUCTION");
        return allPoolInfo;
    }

    @Tool({
        name: "skate_amm_execute_evm_swap",
        description:
            "Gets a Skate AMM quote for a desired asset pair on a specific sourceChain. Executes a swap on EVM chain. Check for sufficient token approval before executing a swap.",
    })
    async executeEVMSwap(walletClient: ViemEVMWalletClient, parameters: SwapQuoteParameters) {
        const {
            amountIn,
            srcChainId,
            tokenAddressIn,
            tokenDecimalIn,
            tokenAddressOut,
            peripheryPoolAddress,
            userAddress,
            slippageLimit = 0.5,
        } = parameters;

        const apiSwapQuote = await apiGetSwapQuote({
            amount: parseUnits(amountIn, tokenDecimalIn),
            srcChainId: srcChainId,
            tokenA: tokenAddressIn,
            tokenB: tokenAddressOut,
            user: userAddress,
            recipient: userAddress,
            slippageLimit: slippageLimit,
        },"PRODUCTION");

        if (!apiSwapQuote.success) {
            return apiSwapQuote.payload?.swapQuote.failedReason;
        }

        if (!apiSwapQuote.payload?.swapQuote) {
            return "Approval is still required...";
        }

        try {
            // Execute swap with swapCall data
            const hash = await walletClient.sendTransaction({
                to: apiSwapQuote.payload?.swapCall.target,
                data: apiSwapQuote.payload?.swapCall.calldata,
            });

            return {
                success: true,
                txHash: hash,
            };
        } catch (error) {
            return {
                success: false,
                error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                message: `Failed to execute swap: ${error.message || error}`,
            };
        }
    }

    @Tool({
        name: "skate_amm_execute_svm_swap",
        description:
            "Gets a Skate AMM quote for a desired asset pair on a specific sourceChain. Executes a swap on SVM chain.",
    })
    async executeSVMSwap(walletClient: SolanaWalletClient, parameters: SwapQuoteParameters) {
        const {
            amountIn,
            srcChainId,
            tokenAddressIn,
            tokenDecimalIn,
            tokenAddressOut,
            peripheryPoolAddress,
            userAddress,
            slippageLimit = 0.5,
        } = parameters;

        const apiSwapQuote = await apiGetSwapQuote({
            amount: parseUnits(amountIn, tokenDecimalIn),
            srcChainId: srcChainId,
            tokenA: tokenAddressIn,
            tokenB: tokenAddressOut,
            recipient: userAddress,
            user: userAddress,
            slippageLimit: slippageLimit,
        },"PRODUCTION");

        if (!apiSwapQuote.success) {
            return apiSwapQuote.payload?.swapQuote.failedReason;
        }

        if (!apiSwapQuote.payload?.swapQuote) {
            return "Approval is still required...";
        }

        try {
            // Execute swap with swapCall data
            const hash = await walletClient.sendTransaction({
                instructions: apiSwapQuote.payload?.swapInstructions,
            });
            const res = walletClient.getAddress();

            return {
                success: true,
                quote: apiSwapQuote,
                txHash: hash,
            };
        } catch (error) {
            return {
                success: false,
                error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                message: `Failed to execute swap: ${error.message || error}`,
            };
        }
    }

    @Tool({
        name: "skate_amm_check_approval",
        description:
            "Returns the approval amounts of the owner & spender for a specified token. Must be checked before making a swap, Only on EVM chains.",
    })
    async checkTokenApproval(walletClient: ViemEVMWalletClient, parameters: TokenApprovalParameters) {
        const { owner, spender, approvalAmount, tokenAddress, chain } = parameters;

        const onchainClient = getPublicClient(chain);

        const ERC20_ABI = [
            {
                type: "function",
                name: "allowance",
                stateMutability: "view",
                inputs: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                ],
                outputs: [{ name: "", type: "uint256" }],
            },
        ];

        // Check if USER has enough approval for tokenIn
        const allowance = await onchainClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [owner, spender],
        });

        // Convert BigInt to string to ensure it can be serialized properly
        return {
            allowance: allowance.toString(),
            hasEnoughAllowance: allowance >= BigInt(approvalAmount),
        };
    }

    @Tool({
        name: "skate_amm_set_approval",
        description:
            "Sets the approval amounts of the owner & spender for a specified token already checked and approval is insufficient for amount to swap. Only on EVM chains.",
    })
    async setTokenApproval(walletClient: ViemEVMWalletClient, parameters: SetTokenApprovalParameters) {
        const { target, callData } = parameters;

        const hash = await walletClient.sendTransaction({
            to: target,
            data: callData,
        });

        return {
            success: true,
            txHash: hash,
        };
    }

    @Tool({
        name: "get_ERC20_balance",
        description:
            "Returns the balance of an ERC20 token for a specific address, in decimal formatted, raw, and includes the raw decimals. Only on EVM chains.",
    })
    async getERC20Balance(walletClient: ViemEVMWalletClient, parameters: ERC20BalanceParameters) {
        const { tokenAddress, owner } = parameters;

        const ERC20_ABI = [
            {
                type: "function",
                name: "balanceOf",
                stateMutability: "view",
                inputs: [
                    { name: "owner", type: "address" },
                ],
                outputs: [{ name: "", type: "uint256" }],
            },
            {
                type: "function",
                name: "decimals",
                stateMutability: "view",
                inputs: [],
                outputs: [{ name: "", type: "uint8" }],
              },
        ];

        const [rawBalance, rawDecimals] = await Promise.all([
            walletClient.read({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [owner],
            }),
            walletClient.read({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: "decimals",
              args: [],
            }),
          ]);
        
        return {
            formattedBalance: formatUnits(rawBalance.value, rawDecimals.value),
            decimals: rawDecimals.value.toString(),
            balance: rawBalance.value.toString(),
        };
    }

    @Tool({
        name: "get_SPL_token_balance",
        description:
            "Returns the balance of an SPL token for a specific address, in decimal formatted, raw, and includes the raw decimals. Only on EVM chains.",
    })
    async getSPLTokenBalance(walletClient: SolanaWalletClient, parameters: SPLTokenBalanceParameters) {
        const { mintAddress, owner } = parameters;

        const resp = await walletClient.getConnection().getParsedTokenAccountsByOwner(new PublicKey(owner), {
            mint: new PublicKey(mintAddress),
        },"processed");

        return resp;
    }
}
