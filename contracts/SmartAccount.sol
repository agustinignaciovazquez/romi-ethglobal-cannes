// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SmartAccount {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Config {
        address preferredToken;
        uint64 destinationChainSelector;
        address destinationWallet;
    }

    Config public userConfig;
    address public immutable userEOA;
    address public immutable swapRouter;
    uint256 public nonce;

    bytes32 private constant CONFIG_TYPEHASH =
        keccak256(
            "Config(address preferredToken,uint64 destinationChainSelector,address destinationWallet,uint256 nonce)"
        );

    bytes32 private immutable DOMAIN_SEPARATOR;

    constructor(address _userEOA, address _swapRouter) // address _linkToken,
    // address _ccipRouter
    {
        userEOA = _userEOA;
        swapRouter = _swapRouter;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("SmartAccount"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    // --- EIP-712 updateConfig via signature ---
    function updateConfigWithSig(
        address preferredToken,
        uint64 destinationChainSelector,
        address destinationWallet,
        uint256 signedNonce,
        bytes calldata signature
    ) external {
        require(signedNonce == nonce, "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                CONFIG_TYPEHASH,
                preferredToken,
                destinationChainSelector,
                destinationWallet,
                signedNonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        address recovered = digest.recover(signature);
        require(recovered == userEOA, "Invalid signature");

        userConfig = Config(
            preferredToken,
            destinationChainSelector,
            destinationWallet
        );
        nonce++;
    }

    // --- SWAP EXECUTION ---
    modifier onlyPreferredToken(address tokenOut) {
        require(tokenOut == userConfig.preferredToken, "Invalid tokenOut");
        _;
    }

    function executeSwap(
        bytes calldata oneInchData,
        address tokenOut
    ) external payable onlyPreferredToken(tokenOut) {
        (bool success, ) = swapRouter.call{value: msg.value}(oneInchData);
        require(success, "Swap failed");
    }

    // --- BRIDGE EXECUTION ---
    modifier onlyDestination(uint64 chainSelector, address receiver) {
        require(
            chainSelector == userConfig.destinationChainSelector,
            "Wrong chain"
        );
        require(receiver == userConfig.destinationWallet, "Wrong wallet");
        _;
    }

    // function bridgeOut(
    //     address token,
    //     uint256 amount,
    //     uint64 chainSelector,
    //     address receiver
    // ) external onlyDestination(chainSelector, receiver) {
    //     _ccipSend(chainSelector, receiver, token, amount);
    // }

    // // --- RECEIVE via CCIP ---
    // function _ccipReceive(
    //     Client.Any2EVMMessage memory message
    // ) internal override {
    //     // You can decode message.data if you use custom payloads
    //     // For example:
    //     // (string memory purpose, bytes memory payload) = abi.decode(message.data, (string, bytes));

    //     // Emit, store or act on data
    //     emit MessageReceived(
    //         message.sourceChainSelector,
    //         message.sender,
    //         message.data
    //     );
    // }

    event MessageReceived(
        uint64 indexed sourceChainSelector,
        bytes sender,
        bytes data
    );

    receive() external payable {}
}
