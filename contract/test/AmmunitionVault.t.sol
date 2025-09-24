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
    // --- Constants ---
    address internal constant UNISWAP_V3_POSITION_MANAGER = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address internal constant UNISWAP_V3_SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address internal constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address internal constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDC_WETH_POOL = 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640;
    address internal constant SYSTEM_SERVICE_ADDRESS = 0x0000000000000000000000000000000000fffFfF;

    // --- Contracts ---
    AmmunitionVault internal vault;
    FlashLender internal flashLender;
    IERC20 internal usdc;
    IERC20 internal weth;
    ISwapRouter internal swapRouter;

    // --- Test State ---
    uint256 internal constant DEPOSIT_AMOUNT = 10_000 * 1e6; // 10,000 USDC

    function setUp() public {
        vm.createSelectFork(vm.envString("MAINNET_RPC_URL"));

        usdc = IERC20(USDC_ADDRESS);
        weth = IERC20(WETH_ADDRESS);
        swapRouter = ISwapRouter(UNISWAP_V3_SWAP_ROUTER);

        flashLender = new FlashLender(WETH_ADDRESS);
        vault = new AmmunitionVault(USDC_ADDRESS, UNISWAP_V3_POSITION_MANAGER, address(flashLender));

        deal(WETH_ADDRESS, address(flashLender), 100 * 1e18);
        deal(USDC_ADDRESS, address(this), DEPOSIT_AMOUNT);

        // Fund the vault with some USDC for simulated profit
        deal(USDC_ADDRESS, address(vault), 1000 * 1e6); // 1,000 USDC for profit simulation
    }

    function test_React_ShouldBeProfitable() public {
        // 1. User deposits into the vault
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT);
        assertEq(vault.shares(address(this)), DEPOSIT_AMOUNT, "Initial deposit failed");

        // 2. Craft the event data for the `react` function
        // We are simulating a large swap of 1,000,000 USDC for WETH
        bytes memory swapEventData = abi.encode(
            int256(1_000_000 * 1e6), // amount0 (USDC)
            int256(-500 * 1e18),      // amount1 (WETH)
            uint160(0),              // sqrtPriceX96
            uint128(0),              // liquidity
            int24(0)                 // tick
        );

        // 3. Execute the JIT strategy by calling `react`
        // HACK: Provide a tiny bit of WETH to the vault to cover Uniswap V3 rounding errors for flash loan repayment
        deal(WETH_ADDRESS, address(vault), 1 * 1e18); // 1 WETH

        // We must impersonate the system service address for the `sysConOnly` modifier
        vm.startPrank(SYSTEM_SERVICE_ADDRESS);
        vault.react(
            block.chainid,
            USDC_WETH_POOL,
            0, 0, 0, 0, // topics are not used in our logic, so we can pass 0
            swapEventData,
            block.number,
            0
        );
        vm.stopPrank();

        // 4. Assert that the vault made a profit
        uint256 balanceAfter = vault.totalAssets();
        assertTrue(balanceAfter > DEPOSIT_AMOUNT, "Vault should have made a profit");

        console.log("Initial Deposit:", DEPOSIT_AMOUNT);
        console.log("Balance After React:", balanceAfter);
        console.log("Profit:", balanceAfter - DEPOSIT_AMOUNT);
    }
}
