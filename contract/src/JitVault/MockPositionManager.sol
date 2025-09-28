// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPositionManager {
    function mint(address, address, int24, int24, uint256) external returns (uint256, uint128, uint256, uint256) {
        return (1, 0, 0, 0);
    }

    function decreaseLiquidity(uint256, uint128) external returns (uint256, uint256) {
        return (0, 0);
    }

    function collect(uint256, address, uint128, uint128) external returns (uint256, uint256) {
        return (0, 0);
    }
}
