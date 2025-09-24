// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {INonfungiblePositionManager} from "./interfaces/INonfungiblePositionManager.sol";
import {IUniswapV3Pool} from "./interfaces/IUniswapV3Pool.sol";
import {IFlashLoanReceiver} from "./FlashLender.sol";
import {FlashLender} from "./FlashLender.sol";
import {console} from "forge-std/console.sol";

import {AbstractReactive} from "../AbstractReactive.sol";

contract AmmunitionVault is AbstractReactive, IFlashLoanReceiver {
    using SafeERC20 for IERC20;

    // --- State Variables ---
    IERC20 public immutable asset; // The asset being held in the vault (e.g., USDC)
    INonfungiblePositionManager public immutable positionManager;
    FlashLender public immutable flashLender;

    mapping(address => uint256) public shares;
    uint256 public totalShares;

    // --- JIT Execution State ---
    struct JitParams {
        address pool;
        address loanToken;
        uint256 loanAmount;
        int24 tickLower;
        int24 tickUpper;
    }
    JitParams private jitParams;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // --- Events ---
    event Deposit(address indexed user, uint256 shares, uint256 amount);
    event Withdraw(address indexed user, uint256 shares, uint256 amount);
    event JitStrategyExecuted(uint256 profit);

    // --- Constructor ---
    constructor(address _asset, address _positionManager, address _flashLender) {
        asset = IERC20(_asset);
        positionManager = INonfungiblePositionManager(_positionManager);
        flashLender = FlashLender(_flashLender);
        owner = msg.sender;
    }

    receive() external payable {}


    // --- Subscription Management ---
    function subscribeToPool(address poolAddress) external onlyOwner {
        bytes32 swapTopic = keccak256("Swap(address,address,int256,int256,uint160,uint128,int24)");
        service.subscribe(block.chainid, poolAddress, uint256(swapTopic), 0, 0, 0);
    }

    // --- Reactive Entrypoint ---
    function react(
        uint256, // chain_id
        address, // _contract
        uint256, // topic_0
        uint256, // topic_1
        uint256, // topic_2
        uint256, // topic_3
        bytes calldata data, // Event data
        uint256, // block_number
        uint256 // op_code
    ) external override sysConOnly {
        // Decode the Uniswap V3 Swap event data
        (int256 amount0, int256 amount1, , , ) = abi.decode(data, (int256, int256, uint160, uint128, int24));

        // Determine which token is our asset and check if the swap is large enough
        // This is a simplified check for the MVP
        uint256 swapSize;
        if (amount0 > 0) { // amount0 is tokenIn
            swapSize = uint256(amount0);
        } else {
            swapSize = uint256(amount1);
        }

        // MIN_SWAP_SIZE would be a configurable value
        uint256 MIN_SWAP_SIZE = 1000 * 1e6; // e.g., 1,000 USDC
        if (swapSize < MIN_SWAP_SIZE) {
            return; // Swap not large enough, ignore
        }

        // --- If swap is large enough, execute JIT strategy ---
        // For the MVP, we use hardcoded params. A real version would calculate these.
        jitParams = JitParams({
            pool: 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640, // USDC/WETH pool
            loanToken: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH
            loanAmount: 5 * 1e18, // 5 WETH
            tickLower: -200000,
            tickUpper: 200000
        });

        flashLender.flashLoan(address(this), jitParams.loanAmount, "");
    }

    uint256 private _lastMintedTokenId;
    uint128 private _lastMintedLiquidity;

    // --- Flash Loan Callback ---
    function onFlashLoan(
        address, // initiator
        address _loanToken,
        uint256 _loanAmount,
        uint256, // fee
        bytes calldata // data
    ) external override returns (bytes32) {
        require(msg.sender == address(flashLender), "Caller is not the flash lender");
        uint256 balanceBefore = asset.balanceOf(address(this));

        JitParams memory params = jitParams;
        IUniswapV3Pool pool = IUniswapV3Pool(params.pool);
        address token0 = pool.token0();
        address token1 = pool.token1();

        uint256 amount0;
        uint256 amount1;
        if (address(asset) == token0) {
            amount0 = balanceBefore;
            amount1 = _loanAmount;
        } else {
            amount0 = _loanAmount;
            amount1 = balanceBefore;
        }

        // Log WETH balance after receiving flash loan
        console.log("Vault WETH balance after flash loan received:", IERC20(params.loanToken).balanceOf(address(this)));

        asset.approve(address(positionManager), amount0);
        IERC20(_loanToken).approve(address(positionManager), amount1);

        (uint256 tokenId, uint128 liquidity, , ) = positionManager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: pool.fee(),
                tickLower: params.tickLower,
                tickUpper: params.tickUpper,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );
        _lastMintedTokenId = tokenId;
        _lastMintedLiquidity = liquidity;

        // Log WETH balance after minting liquidity
        console.log("Vault WETH balance after minting liquidity:", IERC20(params.loanToken).balanceOf(address(this)));

        // --- MVP Simplification: Simulate profit directly ---
        // In a real scenario, fees would be collected from the pool after an external swap.
        // For the demo, we directly add a small profit to the vault.
        uint256 simulatedProfit = 100 * 1e6; // 100 USDC profit (assuming 6 decimals)
        asset.transfer(address(this), simulatedProfit); // Transfer from a pre-funded source, or mint if mock

        // Decrease liquidity to 0 before collecting and burning
        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: _lastMintedTokenId,
                liquidity: _lastMintedLiquidity, // Use actual minted liquidity
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );

        // Log WETH balance after decreasing liquidity
        console.log("Vault WETH balance after decreasing liquidity:", IERC20(params.loanToken).balanceOf(address(this)));

        positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _lastMintedTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        positionManager.burn(_lastMintedTokenId);

        // Log WETH balance before final repayment
        console.log("Vault WETH balance before final repayment:", IERC20(params.loanToken).balanceOf(address(this)));

        uint256 feeAmount = (_loanAmount * flashLender.getFee()) / 1e18;
        IERC20(_loanToken).safeTransfer(address(flashLender), _loanAmount + feeAmount);

        uint256 balanceAfter = asset.balanceOf(address(this));
        if (balanceAfter > balanceBefore) {
            uint256 profit = balanceAfter - balanceBefore;
            emit JitStrategyExecuted(profit);
        }

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    // uniswapV3MintCallback remains as it's required by Uniswap V3
    function uniswapV3MintCallback(uint256 amount0Owed, uint256 amount1Owed, bytes calldata) external {
        address token0 = IUniswapV3Pool(msg.sender).token0();
        address token1 = IUniswapV3Pool(msg.sender).token1();

        if (amount0Owed > 0) {
            IERC20(token0).safeTransfer(msg.sender, amount0Owed);
        }
        if (amount1Owed > 0) {
            IERC20(token1).safeTransfer(msg.sender, amount1Owed);
        }
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit amount must be positive");
        uint256 currentShares = _amountToShares(amount);
        totalShares += currentShares;
        shares[msg.sender] += currentShares;

        asset.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, currentShares, amount);
    }

    function withdraw(uint256 _shares) external {
        require(_shares > 0, "Must withdraw a positive number of shares");
        uint256 userShares = shares[msg.sender];
        require(userShares >= _shares, "Insufficient shares");

        uint256 amount = _sharesToAmount(_shares);
        shares[msg.sender] -= _shares;
        totalShares -= _shares;

        asset.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, _shares, amount);
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function _sharesToAmount(uint256 _shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (_shares * totalAssets()) / totalShares;
    }

    function _amountToShares(uint256 amount) internal view returns (uint256) {
        if (totalAssets() == 0 || totalShares == 0) return amount;
        return (amount * totalShares) / totalAssets();
    }
}
