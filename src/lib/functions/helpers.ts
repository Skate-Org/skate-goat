

// export async function checkApproval(params) {
//     const {owner, spender, approvalAmount} = params;
//     const onchainClient = getPublicClient(CHAIN.ARBITRUM);
            
//     const ERC20_ABI = [
//         {
//             type: 'function',
//             name: 'allowance',
//             stateMutability: 'view',
//             inputs: [
//             { name: 'owner', type: 'address' },
//             { name: 'spender', type: 'address' },
//             ],
//             outputs: [{ name: '', type: 'uint256' }],
//         },
//         // stateMutability: 
//         ];
    
//     // Check if USER has enough approval for tokenIn
//     const allowance = await onchainClient.readContract({
//         address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
//     //   abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
//         abi: ERC20_ABI,
//         functionName: 'allowance',
//         args: [owner, spender],
//     })
//     console.log(allowance);
//     return allowance;

// }