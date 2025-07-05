// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.13;

import {CREATE3} from "solmate/src/utils/CREATE3.sol";

interface IL2Registrar {
    function register(string calldata label, address nameOwner) external;

    function available(string calldata label) external view returns (bool);
}

contract RomiFactory {
    address public owner;
    IL2Registrar public l2Registrar;

    event SmartAccountDeployed(
        address indexed smartAccount,
        address indexed user,
        string ensName
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event L2RegistrarUpdated(address indexed newRegistrar);

    error NotOwner();
    error ENSNameNotAvailable();
    error ENSRegistrationFailed();
    error L2RegistrarNotAvailable();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier requiresL2Registrar() {
        if (address(l2Registrar) == address(0))
            revert L2RegistrarNotAvailable();
        _;
    }

    constructor(address _l2Registrar) {
        owner = msg.sender;
        l2Registrar = IL2Registrar(_l2Registrar); // Can be zero address for chains without L2Registrar
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

    function deployWithENS(
        bytes32 salt,
        bytes memory creationCode,
        string calldata ensName,
        address nameOwner
    )
        external
        payable
        onlyOwner
        requiresL2Registrar
        returns (address deployed)
    {
        // Check if ENS name is available
        if (!l2Registrar.available(ensName)) {
            revert ENSNameNotAvailable();
        }

        // Deploy the smart account
        salt = keccak256(abi.encodePacked(msg.sender, salt));
        deployed = CREATE3.deploy(salt, creationCode, msg.value);

        // Register ENS name
        try l2Registrar.register(ensName, nameOwner) {
            emit SmartAccountDeployed(deployed, nameOwner, ensName);
        } catch {
            revert ENSRegistrationFailed();
        }
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

    function setL2Registrar(address newRegistrar) external onlyOwner {
        // newRegistrar can be zero address for chains without L2Registrar
        l2Registrar = IL2Registrar(newRegistrar);
        emit L2RegistrarUpdated(newRegistrar);
    }

    function checkENSAvailability(
        string calldata ensName
    ) external view requiresL2Registrar returns (bool) {
        return l2Registrar.available(ensName);
    }

    function hasL2Registrar() external view returns (bool) {
        return address(l2Registrar) != address(0);
    }
}
