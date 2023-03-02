// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import './NFTDutchAuction_ERC20Bids.sol';

contract NFTDutchAuction_ERC20Bids_v2 is NFTDutchAuction_ERC20Bids {

    
    // function to check the version of the contract
    function isVer2() public pure returns (uint256){
        return 2;
    }

    // function to check if the caller is the contract owner
    function isOwner() public view onlyOwner returns(bool) {
        return true;
    }
    
}