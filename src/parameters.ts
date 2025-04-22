import { createToolParameters } from "@goat-sdk/core";
import { CHAIN, VM } from "@skate-org/skate-app-amm";
import { z } from "zod";

export class KernelPoolParameters extends createToolParameters(
    z.object({
        kernelPoolAddress: z.string().describe("The address of the kernel pool"),
    }),
) {}

export class UserWalletParameters extends createToolParameters(
    z.object({
        userWalletAddress: z.string().describe("The address of the user's wallet"),
        vmType: z.nativeEnum(VM).describe("The type of virtual machine"),
    }),
) {}

export class SwapQuoteParameters extends createToolParameters(
    z.object({
        amountIn: z.string().describe("Amount of tokens to swap as string, pre parseUnits format"),
        srcChainId: z.nativeEnum(CHAIN).describe("Chain to swap from"),
        peripheryPoolAddress: z.string().describe("Address of the periphery pool"),
        tokenAddressIn: z.string().describe("Symbol of the token to swap from (e.g., USDC)"),
        tokenDecimalIn: z.number().describe("Number of decimals for tokenIn"),
        tokenAddressOut: z.string().describe("Symbol of the token to swap to (e.g., WETH)"),
        userAddress: z.string().describe("Address of the user"),
        chains: z.array(z.nativeEnum(CHAIN)).describe("Chains to check for the swap (e.g., ARBITRUM, BASE)"),
        slippageLimit: z.number().optional().describe("Maximum slippage allowed for the swap (e.g., 0.01 for 1%)"),
    }),
) {}

export class EmptyParameters extends createToolParameters(z.object({})) {}

export class TokenApprovalParameters extends createToolParameters(
    z.object({
        owner: z.string().describe("Address of the owner of the token"),
        spender: z
            .string()
            .describe("Address of the spender of the token, should usually be the periphery pool address"),
        approvalAmount: z.number().describe("Amount of tokens to approve in bigint format, "),
        tokenAddress: z.string().describe("Address of the token to approve"),
        chain: z.nativeEnum(CHAIN).describe("Chain to check for approval"),
    }),
) {}

export class SetTokenApprovalParameters extends createToolParameters(
    z.object({
        target: z.string().describe("Address of the target contract"),
        callData: z.string().describe("Call data for the target contract"),
        chain: z.nativeEnum(CHAIN).describe("Chain to check for approval"),
    }),
) {}
