// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

interface IFlashLoanReceiver {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32);
}

contract FlashLender {
    using SafeERC20 for IERC20;
    IERC20 public immutable loanToken;
    function getFee() public pure returns (uint256) {
        return 0; // 0% fee for MVP
    }

    constructor(address _loanToken) {
        loanToken = IERC20(_loanToken);
    }

    function deposit(uint256 amount) external {
        loanToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function flashLoan(address receiver, uint256 amount, bytes calldata data) external {
        require(amount > 0, "Amount must be > 0");
        uint256 balanceBefore = loanToken.balanceOf(address(this));
        require(balanceBefore >= amount, "Insufficient liquidity");

        loanToken.safeTransfer(receiver, amount);

        bytes32 expectedReturn = keccak256("ERC3156FlashBorrower.onFlashLoan");
        bytes32 returned = IFlashLoanReceiver(receiver).onFlashLoan(
            msg.sender,
            address(loanToken),
            amount,
            getFee(),
            data
        );
        require(returned == expectedReturn, "Invalid flash loan callback return");

        uint256 balanceAfter = loanToken.balanceOf(address(this));
        uint256 feeAmount = (amount * getFee()) / 1e18;
        require(balanceAfter >= balanceBefore + feeAmount, "Flash loan not repaid with fee");
    }
}
