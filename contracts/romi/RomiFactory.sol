// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.13;

import {CREATE3} from "solmate/src/utils/CREATE3.sol";

contract RomiFactory {
    address public owner;

    event SmartAccountDeployed(
        address indexed smartAccount,
        address indexed user
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function deploy(
        bytes32 salt,
        bytes memory creationCode
    ) external payable returns (address deployed) {
        // hash salt with the deployer address to give each deployer its own namespace
        salt = keccak256(abi.encodePacked(msg.sender, salt));
        return CREATE3.deploy(salt, creationCode, msg.value);
    }

    function deployForUser(
        bytes32 salt,
        bytes memory creationCode,
        address user
    )
        external
        payable
        onlyOwner
        returns (address deployed)
    {
        // Deploy the smart account
        salt = keccak256(abi.encodePacked(msg.sender, salt));
        deployed = CREATE3.deploy(salt, creationCode, msg.value);
        
        emit SmartAccountDeployed(deployed, user);
    }

    function getDeployed(
        address deployer,
        bytes32 salt
    ) external view returns (address deployed) {
        // hash salt with the deployer address to give each deployer its own namespace
        salt = keccak256(abi.encodePacked(deployer, salt));
        return CREATE3.getDeployed(salt);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
