// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RomiEIP712} from "./RomiEIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Legacy {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract RomiSmartAccount is Ownable, RomiEIP712 {
    using ECDSA for bytes32;
    
    // Custom errors for CCIP
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector);
    error InvalidReceiverAddress();

    // Event for CCIP transfers
    event TokensTransferred(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        address token,
        uint256 tokenAmount,
        address feeToken,
        uint256 fees
    );

    struct Config {
        address token;
        uint256 chainId;
    }

    Config public config;
    // Starts in 0 and increments with each config update
    uint256 public nextNonce;
    address public oneInchRouter;
    
    // CCIP related variables
    IRouterClient private ccipRouter;
    mapping(uint64 => bool) public allowlistedChains;

    bytes32 private constant CONFIG_TYPEHASH =
        keccak256("Config(address token,uint256 chainId,uint256 nonce)");

    constructor(
        address initialOwner,
        uint256 initialNextNonce,
        address oneInchRouterAddress,
        address ccipRouterAddress
    ) Ownable(initialOwner) RomiEIP712("Romi Smart Account", "1") {
        nextNonce = initialNextNonce;
        oneInchRouter = oneInchRouterAddress;
        ccipRouter = IRouterClient(ccipRouterAddress);
    }

    // -------------------------------
    // CCIP Management Functions
    // -------------------------------
    
    /// @dev Modifier that checks if the chain with the given destinationChainSelector is allowlisted.
    modifier onlyAllowlistedChain(uint64 _destinationChainSelector) {
        if (!allowlistedChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }

    /// @dev Modifier that checks the receiver address is not 0.
    modifier validateReceiver(address _receiver) {
        if (_receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }

    /// @dev Updates the allowlist status of a destination chain for transactions.
    /// @param _destinationChainSelector The selector of the destination chain to be updated.
    /// @param allowed The allowlist status to be set for the destination chain.
    function allowlistDestinationChain(
        uint64 _destinationChainSelector,
        bool allowed
    ) external onlyOwner {
        allowlistedChains[_destinationChainSelector] = allowed;
    }

    /// @notice Transfer tokens to receiver on the destination chain after 1inch swap.
    /// @notice Pay in native gas (ETH).
    /// @notice This function should be called after executing a 1inch swap.
    /// @param _destinationChainSelector The identifier for the destination blockchain.
    /// @param _receiver The address of the recipient on the destination blockchain.
    /// @param _token Token address (should be the output token from 1inch swap).
    /// @param _amount Token amount to transfer cross-chain.
    /// @return messageId The ID of the CCIP message that was sent.
    function transferTokensCrossChain(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    )
        public
        onlyOwner
        onlyAllowlistedChain(_destinationChainSelector)
        validateReceiver(_receiver)
        returns (bytes32 messageId)
    {
        // Ensure the token is the configured output token from swaps
        require(_token == config.token, "Token not configured for cross-chain transfer");
        
        // Ensure contract has enough tokens
        require(
            IERC20(_token).balanceOf(address(this)) >= _amount,
            "Insufficient token balance"
        );

        // Create CCIP message (paying with native ETH)
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _token,
            _amount,
            address(0) // Pay fees in native ETH
        );

        // Get the fee required to send the message
        uint256 fees = ccipRouter.getFee(_destinationChainSelector, evm2AnyMessage);

        // Check if contract has enough ETH for fees
        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);

        // Approve the router to spend tokens
        IERC20(_token).approve(address(ccipRouter), _amount);

        // Send the message through CCIP router
        messageId = ccipRouter.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit event
        emit TokensTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            _token,
            _amount,
            address(0), // Native ETH for fees
            fees
        );

        return messageId;
    }

    /// @notice Execute 1inch swap and immediately transfer tokens cross-chain.
    /// @notice This is a convenience function that combines swap + cross-chain transfer.
    /// @param swapData The calldata for the 1inch swap.
    /// @param destinationChainSelector The destination chain for cross-chain transfer.
    /// @param receiver The receiver address on the destination chain.
    /// @param transferAmount The amount of output tokens to transfer (0 = transfer all).
    /// @return messageId The CCIP message ID.
    function swapAndTransferCrossChain(
        bytes calldata swapData,
        uint64 destinationChainSelector,
        address receiver,
        uint256 transferAmount
    )
        external
        onlyOwner
        onlyAllowlistedChain(destinationChainSelector)
        validateReceiver(receiver)
        returns (bytes32 messageId)
    {
        // Execute the 1inch swap first
        require(_verifySwapOutput(swapData, config.token), "Invalid output token");
        
        uint256 balanceBefore = IERC20(config.token).balanceOf(address(this));
        
        (bool success, bytes memory result) = oneInchRouter.call(swapData);
        require(success, _getRevertMsg(result));
        
        uint256 balanceAfter = IERC20(config.token).balanceOf(address(this));
        uint256 swapOutput = balanceAfter - balanceBefore;
        
        // Determine transfer amount (0 means transfer all received tokens)
        uint256 amountToTransfer = transferAmount == 0 ? swapOutput : transferAmount;
        require(amountToTransfer <= swapOutput, "Transfer amount exceeds swap output");
        
        // Transfer tokens cross-chain
        return transferTokensCrossChain(
            destinationChainSelector,
            receiver,
            config.token,
            amountToTransfer
        );
    }

    /// @notice Get the fee required for a cross-chain transfer.
    /// @param _destinationChainSelector The destination chain selector.
    /// @param _token The token to transfer.
    /// @param _amount The amount to transfer.
    /// @return fee The fee in native token (ETH) required for the transfer.
    function getCrossChainFee(
        uint64 _destinationChainSelector,
        address _token,
        uint256 _amount
    ) external view returns (uint256 fee) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            address(this), // dummy receiver for fee calculation
            _token,
            _amount,
            address(0) // Pay fees in native ETH
        );
        
        return ccipRouter.getFee(_destinationChainSelector, evm2AnyMessage);
    }

    /// @notice Build a CCIP message for token transfer.
    /// @param _receiver The receiver address.
    /// @param _token The token to transfer.
    /// @param _amount The amount to transfer.
    /// @param _feeTokenAddress The fee token address (address(0) for native).
    /// @return Client.EVM2AnyMessage The constructed CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        address _token,
        uint256 _amount,
        address _feeTokenAddress
    ) private pure returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        // Create CCIP message
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: "",
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.GenericExtraArgsV2({
                    gasLimit: 0, // Use default gas limit
                    allowOutOfOrderExecution: true
                })
            ),
            feeToken: _feeTokenAddress
        });
    }

    // -------------------------------
    // 1inch Swap Functions
    // -------------------------------

    function approveToken(address token) external {
        require(
            IERC20Legacy(token).approve(oneInchRouter, type(uint256).max),
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
    ) internal pure returns (bool) {
        return
            data.length >= 20 &&
            bytes20(data[data.length - 20:]) == bytes20(expected);
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
