// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

import {AmmunitionVault} from "../src/JitVault/AmmunitionVault.sol";
import {MockERC20} from "../src/JitVault/MockERC20.sol";
import {FlashLender} from "../src/JitVault/FlashLender.sol";
import {ISystemContract} from "../src/ISystemContract.sol";

import {INonfungiblePositionManager} from "../src/JitVault/interfaces/INonfungiblePositionManager.sol";
import {ISwapRouter} from "../src/JitVault/interfaces/ISwapRouter.sol";
import {IUniswapV3Pool} from "../src/JitVault/interfaces/IUniswapV3Pool.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract AmmunitionVaultReactiveTest is Test {
    // --- Contracts ---
    AmmunitionVault internal vault;
    FlashLender internal flashLender;
    MockERC20 internal usdc;
    MockERC20 internal weth;

    // --- Test State ---
    uint256 internal constant DEPOSIT_AMOUNT = 10_000 * 1e6; // 10,000 USDC

    function setUp() public {
        usdc = new MockERC20();
        weth = new MockERC20();

        flashLender = new FlashLender(address(weth));
        vault = new AmmunitionVault(address(usdc), address(0), address(flashLender));

        usdc.mint(address(this), DEPOSIT_AMOUNT * 2);
    }

    function test_Deposit() public {
        // 1. First user deposits into the vault
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT);
        assertEq(vault.shares(address(this)), DEPOSIT_AMOUNT, "Initial deposit shares failed");
        assertEq(vault.totalAssets(), DEPOSIT_AMOUNT, "Initial deposit total assets failed");

        // 2. Second user deposits into the vault
        usdc.transfer(address(2), DEPOSIT_AMOUNT);
        vm.startPrank(address(2));
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT);
        assertEq(vault.shares(address(2)), DEPOSIT_AMOUNT, "Second deposit shares failed");
        assertEq(vault.totalAssets(), DEPOSIT_AMOUNT * 2, "Second deposit total assets failed");
        vm.stopPrank();
    }

    function test_Withdraw() public {
        // 1. User deposits into the vault
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT);

        // 2. User withdraws from the vault
        uint256 shares = vault.shares(address(this));
        vault.withdraw(shares);

        assertEq(vault.shares(address(this)), 0, "Withdraw shares failed");
        assertEq(usdc.balanceOf(address(this)), DEPOSIT_AMOUNT * 2, "Withdraw balance failed");
    }
}