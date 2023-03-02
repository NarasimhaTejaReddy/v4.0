//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Contract for conducting a Dutch Auction of an ERC721 token using ERC20 tokens as bids
contract NFTDutchAuction_ERC20Bids is Initializable, UUPSUpgradeable {
    IERC721 public nftContract;
    uint256 public nftTokenId;
    IERC20 public myToken;

    bool public auctionEnd;
    address payable public owner;
    address public tokenAddress;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;

    // initialize the contract with the necessary parameters
    function initialize(address erc20TokenAddress, address erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) public initializer {
        auctionEnd = false;
        owner = payable(msg.sender);
        tokenAddress = erc721TokenAddress;
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice =_reservePrice +_numBlocksAuctionOpen *_offerPriceDecrement;
        nftContract = IERC721(erc721TokenAddress);
        myToken = IERC20(erc20TokenAddress);
    }



    // modifier to ensure that the caller is the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner,"Only the contract owner can perform this action.");
        _;
    }

    

    // function to authorize an upgrade of the contract
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // function to upgrade the contract to a new implementation
    function upgrade(address newImplementation) public onlyOwner {
        _authorizeUpgrade(newImplementation);
        _upgradeTo(newImplementation);
    }

    // function for placing a bid on the NFT
    function bid() external payable returns (address) {
        require(!auctionEnd, "The auction already ended.");
        require(myToken.balanceOf(msg.sender) >= initialPrice - offerPriceDecrement *(block.number - numBlocksAuctionOpen),"Your bid is lower than the minimum bid");
        auctionEnd = true;
        myToken.transferFrom(msg.sender, nftContract.ownerOf(nftTokenId), myToken.balanceOf(msg.sender));
        nftContract.transferFrom(nftContract.ownerOf(nftTokenId), msg.sender, nftTokenId);
        return msg.sender;
    }
}