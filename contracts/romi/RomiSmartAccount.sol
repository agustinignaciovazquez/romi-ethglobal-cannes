// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RomiEIP712} from "./RomiEIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

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
    struct Config {
        address token;
        uint256 chainId;
    }

    Config public config;
    // Starts in 0 and increments with each config update
    uint256 public nextNonce;
    address public oneInchRouter;

    bytes32 private constant CONFIG_TYPEHASH =
        keccak256("Config(address token,uint256 chainId,uint256 nonce)");

    constructor(
        address initialOwner,
        uint256 initialNextNonce,
        address oneInchRouterAddress
    ) Ownable(initialOwner) RomiEIP712("Romi Smart Account", "1") {
        nextNonce = initialNextNonce;
        oneInchRouter = oneInchRouterAddress;
    }

    // -------------------------------
    // 1inch Swap Functions
    // -------------------------------

    function approveToken(address token) external {
        require(
            IERC20(token).approve(oneInchRouter, type(uint256).max),
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
