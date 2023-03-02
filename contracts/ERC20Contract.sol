// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Contract is ERC20 {
    constructor() ERC20("myERC20", "NFT") {}
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}