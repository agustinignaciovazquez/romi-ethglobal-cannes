// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RomiEIP712} from "./RomiEIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RomiSmartAccount is Ownable, RomiEIP712 {
    using ECDSA for bytes32;
    struct Config {
        address token;
        uint256 chainId;
    }

    Config public config;
    // Starts in 0 and increments with each config update
    uint256 public nextNonce;

    bytes32 private constant CONFIG_TYPEHASH =
        keccak256("Config(address token,uint256 chainId,uint256 nonce)");

    constructor(
        address initialOwner,
        uint256 initialNextNonce
    ) Ownable(initialOwner) RomiEIP712("Romi Smart Account", "1") {
        nextNonce = initialNextNonce;
    }

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
