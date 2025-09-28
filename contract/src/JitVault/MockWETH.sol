// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";
import "forge-std/console.sol";

contract MockWETH is MockERC20 {
    constructor() {
        console.log("MockWETH deployed");
    }
}
