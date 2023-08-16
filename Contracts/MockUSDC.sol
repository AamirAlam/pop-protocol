// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockUSDC is ERC20 {
    using SafeERC20 for IERC20;

    constructor() ERC20("Mock USDC", "USDC") {
        //1000000 USDC minted
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address receiver) public {
        _mint(receiver, 10000 * (10 ** uint256(decimals())));
    }

    receive() external payable {}

    fallback() external payable {}
}
