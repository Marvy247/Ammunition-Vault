// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AmmunitionVault} from "../src/JitVault/AmmunitionVault.sol";
import {MockERC20} from "../src/JitVault/MockERC20.sol";

contract FundVault is Script {
    address vaultAddress = 0xa965aFC08A95038aC92e5eC6590d3508CE1b6ACD;
    address assetAddress = 0x941187A0A47CEeC2fCE06AF8f19A44335339E989;
    address keeperAddress = 0xcB1c741CdBFBC4062b10Ade5Eb2cD4fced0f9689;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MockERC20 assetToken = MockERC20(assetAddress);
        AmmunitionVault vault = AmmunitionVault(payable(vaultAddress));

        // Mint some mock USDC to the keeper address
        uint256 mintAmount = 50_000 * 1e6; // 50,000 USDC
        assetToken.mint(keeperAddress, mintAmount);
        console.log("Minted", mintAmount, "mock USDC to keeper");

        vm.stopBroadcast();

        // Start a new broadcast and prank as the keeper
        vm.startPrank(keeperAddress);

        // Approve the vault to spend the USDC
        assetToken.approve(address(vault), mintAmount);
        console.log("Approved vault to spend USDC");

        // Deposit the USDC into the vault
        vault.deposit(mintAmount);
        console.log("Deposited", mintAmount, "USDC into the vault");

        vm.stopPrank();
    }
}
