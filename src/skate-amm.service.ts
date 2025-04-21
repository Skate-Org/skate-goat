// @ts-nocheck
import { Tool } from "@goat-sdk/core";
import { ViemEVMWalletClient } from "@goat-sdk/wallet-viem";
import { CheckTokenApprovalParameters, EmptyParameters, KernelPoolParameters, SetTokenApprovalParameters, SwapQuoteParameters, TokenApprovalParameters, UserWalletParameters } from "./parameters.js";
import { getAllPoolInfo, getSlot0, getUserPositions, getSwapQuote, KERNEL_POOL, PoolKey, apiGetSwapQuote } from "@skate-org/skate-app-amm";
import { createPublicClient, defineChain, http, parseUnits } from "viem";
import { giveMeSwapQuote } from "./test.js";
import { getPublicClient, getWalletClient } from "./lib/multichain/client.js";

const skateChain = defineChain({
    id: 5051,
    name: "Skate",
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.skatechain.org']
        },
      },
      blockExplorers: {},
      contracts: {},
})

const SkatePublicClient = createPublicClient({
    chain: skateChain,
    transport: http("https://rpc.skatechain.org"),
    pollingInterval: 1000,
})


export class SkateAmmService {
    @Tool({
        description: "Retrieves all markets supported by the Skate AMM"
    })
    async getTradingPairs(parameters: EmptyParameters) {
        const allPoolInfo = await getAllPoolInfo();
        return allPoolInfo;
    }

    @Tool({
        name: "skate_amm_execute_swap",
        description: "Gets a Skate AMM quote for a desired asset pair on a specific sourceChain. Executes a swap. Check for sufficient token approval before executing a swap."
    })
    async executeSwap(walletClient: ViemEVMWalletClient, parameters: SwapQuoteParameters) {
        const { amountIn, srcChainId, tokenAddressIn, tokenDecimalIn, tokenAddressOut, peripheryPoolAddress, userAddress, slippageLimit = 0.5 } = parameters;

        const apiSwapQuote = await apiGetSwapQuote(
            {
                amount: parseUnits(amountIn, tokenDecimalIn),
                srcChainId: srcChainId,
                tokenA: tokenAddressIn,
                tokenB: tokenAddressOut,
                user: userAddress,
                recipient: userAddress,
                slippageLimit: slippageLimit
            }
        )

        if (!apiSwapQuote.success) {
            return apiSwapQuote.payload?.swapQuote.failedReason;
        }

        if (!apiSwapQuote.payload?.swapQuote) { 
            return "Approval is still required..."
        }

        try {
            // Execute swap with swapCall data
            const hash = await walletClient.sendTransaction({
                to: apiSwapQuote.payload?.swapCall.target, 
                data: apiSwapQuote.payload?.swapCall.calldata,
            })
    
            return {
                success: true,
                txHash: hash
            };
        } catch (error) {
            return {
                success: false,
                error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                message: `Failed to execute swap: ${error.message || error}`
            };
        }
    }

    @Tool({
        name: "skate_amm_check_approval",
        description:
            "Returns the approval amounts of the owner & spender for a specified token. Must be checked before making a swap.",
    })
    async checkTokenApproval(walletClient: ViemEVMWalletClient,parameters: TokenApprovalParameters) {
        const { owner, spender, approvalAmount, tokenAddress, chain } = parameters;

        const onchainClient = getPublicClient(chain);
                    
        const ERC20_ABI = [
            {
                type: 'function',
                name: 'allowance',
                stateMutability: 'view',
                inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                ],
                outputs: [{ name: '', type: 'uint256' }],
            },
        ];
        
        // Check if USER has enough approval for tokenIn
        const allowance = await onchainClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [owner, spender],
        })

        // Convert BigInt to string to ensure it can be serialized properly
        return { 
            allowance: allowance.toString(),
            hasEnoughAllowance: allowance >= BigInt(approvalAmount)
        };
    }

    @Tool({
        name: "skate_amm_set_approval",
        description:
            "Sets the approval amounts of the owner & spender for a specified token already checked and approval is insufficient for amount to swap.",
    })
    async setTokenApproval(walletClient: ViemEVMWalletClient, parameters: SetTokenApprovalParameters) {
        const { target, callData } = parameters;

        const hash = await walletClient.sendTransaction({
            to: target,
            data: callData,
        })

        return {
            success: true,
            txHash: hash
        };
    }
}