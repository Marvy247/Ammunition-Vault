// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AmmunitionVault} from "../src/JitVault/AmmunitionVault.sol";
import {FlashLender} from "../src/JitVault/FlashLender.sol";
import {MockERC20} from "../src/JitVault/MockERC20.sol";
import {MockPositionManager} from "../src/JitVault/MockPositionManager.sol";
import {MockWETH} from "../src/JitVault/MockWETH.sol";

contract Deploy is Script {
    function run(uint256 deployerPrivateKey) external {
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockERC20 for asset and loan token
        MockERC20 assetToken = new MockERC20();
        console.log("MockERC20 (asset) deployed at:", address(assetToken));

        // Deploy MockWETH
        MockWETH weth = new MockWETH();
        console.log("MockWETH deployed at:", address(weth));

        // Deploy FlashLender
        FlashLender flashLender = new FlashLender(address(weth));
        console.log("FlashLender deployed at:", address(flashLender));

        // Deploy MockPositionManager
        MockPositionManager positionManager = new MockPositionManager();
        console.log("MockPositionManager deployed at:", address(positionManager));

        // Deploy AmmunitionVault
        AmmunitionVault vault = new AmmunitionVault(
            address(assetToken),
            address(positionManager),
            address(flashLender)
        );
        console.log("AmmunitionVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
