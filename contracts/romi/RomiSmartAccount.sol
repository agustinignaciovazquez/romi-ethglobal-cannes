// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RomiEIP712} from "./RomiEIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";

interface IAggregationRouterV6 {
    struct SwapDescription {
        address srcToken;
        address dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

contract RomiSmartAccount is Ownable, RomiEIP712 {
    using ECDSA for bytes32;

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
    struct Config {
        address token;
        uint256 chainId;
    }

    Config public config;
    // Starts in 0 and increments with each config update
    uint256 public nextNonce;
    address public oneInchRouter;
    address public chainLinkRouter;

    bytes32 private constant CONFIG_TYPEHASH =
        keccak256("Config(address token,uint256 chainId,uint256 nonce)");

    constructor(
        address initialOwner,
        uint256 initialNextNonce,
        address oneInchRouterAddress,
        address chainLinkAddress
    ) Ownable(initialOwner) RomiEIP712("Romi Smart Account", "1") {
        nextNonce = initialNextNonce;
        oneInchRouter = oneInchRouterAddress;
        chainLinkRouter = chainLinkAddress;
    }

    // -------------------------------
    // 1inch Swap Functions
    // -------------------------------

    function approveToken(address token, address spender) external {
        require(
            spender == oneInchRouter || spender == chainLinkRouter,
            "Invalid spender"
        );
        require(
            IERC20(token).approve(spender, type(uint256).max),
            "Approve failed"
        );
    }

    function executeSwap(bytes calldata data) external {
        require(_verifySwapOutput(data, config.token), "Invalid output token");

        (bool success, bytes memory result) = oneInchRouter.call(data);
        require(success, _getRevertMsg(result));
    }

    function _verifySwapOutput(
        bytes calldata data,
        address expected
    ) public view returns (bool) {
        // Confirm selector
        bytes4 selector;
        assembly {
            selector := calldataload(data.offset)
        }

        require(
            selector == IAggregationRouterV6.swap.selector,
            "Wrong selector"
        );

        // Decode calldata
        (, IAggregationRouterV6.SwapDescription memory desc, ) = abi.decode(
            data[4:],
            (address, IAggregationRouterV6.SwapDescription, bytes)
        );

        return desc.dstToken == expected && desc.dstReceiver == address(this);
    }

    function _getRevertMsg(
        bytes memory _returnData
    ) internal pure returns (string memory) {
        if (_returnData.length < 68) return "Call failed";
        assembly {
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string));
    }

    // -------------------------------
    // CCIP
    // -------------------------------

    function _buildCCIPMessage(
        address _receiver,
        address _token,
        uint256 _amount,
        address _feeTokenAddress
    ) private pure returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: "", // No data
                tokenAmounts: tokenAmounts, // The amount and type of token being transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit and allowing out-of-order execution.
                    // Best Practice: For simplicity, the values are hardcoded. It is advisable to use a more dynamic approach
                    // where you set the extra arguments off-chain. This allows adaptation depending on the lanes, messages,
                    // and ensures compatibility with future CCIP upgrades. Read more about it here: https://docs.chain.link/ccip/concepts/best-practices/evm#using-extraargs
                    Client.GenericExtraArgsV2({
                        gasLimit: 0, // Gas limit for the callback on the destination chain
                        allowOutOfOrderExecution: true // Allows the message to be executed out of order relative to other messages from the same sender
                    })
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }

    function bridge(
        uint64 _destinationChainSelector
    ) external payable returns (bytes32 messageId) {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        // address(0) means fees are paid in native gas
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            address(this),
            config.token,
            IERC20(config.token).balanceOf(address(this)),
            address(0)
        );

        // Get the fee required to send the message
        uint256 fees = IRouterClient(chainLinkRouter).getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > msg.value) revert NotEnoughBalance(msg.value, fees);

        // Send the message through the router and store the returned message ID
        messageId = IRouterClient(chainLinkRouter).ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        (bool success, ) = msg.sender.call{value: msg.value - fees}("");
        require(success, "ETH transfer failed");

        // Return the message ID
        return messageId;
    }

    // -------------------------------
    // Romi Functions
    // -------------------------------

    function updateConfigWithSig(
        address token,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(nonce == nextNonce, "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(CONFIG_TYPEHASH, token, chainId, nonce)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == owner(), "Invalid signature");

        config = Config(token, chainId);
        nonce++;
    }

    function transferERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Invalid token");

        // standard ERC-20 transferFrom
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );

        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "Token transfer failed"
        );
    }

    function transferNative(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Native token transfer failed");
    }

    receive() external payable {}
}
