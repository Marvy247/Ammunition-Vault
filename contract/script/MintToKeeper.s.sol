// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockERC20} from "../src/JitVault/MockERC20.sol";

contract MintToKeeper is Script {
    address mockUSDC = 0x941187A0A47CEeC2fCE06AF8f19A44335339E989;
    address keeperAddress = 0xcB1c741CdBFBC4062b10Ade5Eb2cD4fced0f9689;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MockERC20 usdc = MockERC20(mockUSDC);

        // Mint 100,000 USDC to the keeper address
        uint256 mintAmount = 100_000 * 1e6; // 100,000 USDC
        usdc.mint(keeperAddress, mintAmount);
        console.log("Minted", mintAmount, "mock USDC to keeper address", keeperAddress);

        vm.stopBroadcast();
    }
}
