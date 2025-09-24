// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AmmunitionVault} from "../src/JitVault/AmmunitionVault.sol";
import {FlashLender} from "../src/JitVault/FlashLender.sol";
import {MockERC20} from "../src/JitVault/MockERC20.sol";

contract Deploy is Script {
    // --- Sepolia Addresses ---
    address positionManager = 0x1238536071E1c677A632429e3655c799b22cDA52;
    address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockERC20 for asset and loan token
        MockERC20 assetToken = new MockERC20();
        console.log("MockERC20 (asset) deployed at:", address(assetToken));

        // Deploy FlashLender
        FlashLender flashLender = new FlashLender(weth);
        console.log("FlashLender deployed at:", address(flashLender));

        // Deploy AmmunitionVault
        AmmunitionVault vault = new AmmunitionVault(
            address(assetToken),
            positionManager,
            address(flashLender)
        );
        console.log("AmmunitionVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
