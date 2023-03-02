import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat/";


describe("upgradeable test", function () {

    // Define a function to deploy the auction fixture
    async function deployAuctionFixture() {

      // Get the owner and bidder signers
        const [owner, bidder] = await ethers.getSigners();

        // Deploy the NFT token contract
        const NFTToken = await ethers.getContractFactory("BasicNFT");
        const NFT = await NFTToken.connect(owner).deploy();
        await NFT.mint(owner.address, 1);

        // Deploy the ERC20 token contract
        const ERC20Token = await ethers.getContractFactory("ERC20Contract");
        const E20 = await ERC20Token.connect(bidder).deploy();
        await E20.mint(bidder.address, 2000);

        // Deploy the NFT Dutch Auction contract using the upgrades plugin
        const NFTDutchAuctionToken = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        const NFTDutchAuction = await upgrades.deployProxy(NFTDutchAuctionToken,[E20.address, NFT.address, 1, 1000, 10, 100,]);
        await NFT.connect(owner).approve(NFTDutchAuction.address, 1);

        // Return the necessary contracts and signers for testing
        return { NFT, E20, NFTDutchAuctionToken, NFTDutchAuction, owner, bidder };
    }

    describe("NFT ERC20 Dutch Auction", function () {

      // Define a test case to check if the NFT contract was initialized successfully
        it("Should initialize NFT successfully", async function () {
            const { NFT , NFTDutchAuction } = await loadFixture(deployAuctionFixture);

            // Assert that the NFT contract address was correctly set
            expect(await NFTDutchAuction.nftContract()).to.equal(NFT.address);
            
        });

        // Define a test case to check if the ERC20 contract was initialized successfully
        it("Should initialize ERC20 successfully", async function () {
          const { E20, NFTDutchAuction } = await loadFixture(deployAuctionFixture);

          // Assert that the ERC20 contract address was correctly set
          expect(await NFTDutchAuction.myToken()).to.equal(E20.address);
      });

        
        // Define a test case to check if only the contract owner can perform certain actions
        it("Should connect to the owner successfully", async function () {
            const { NFTDutchAuction, bidder } = await loadFixture(deployAuctionFixture);
            const upgradedNFTDutchAuctionToken = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids_v2");

            // Upgrade the NFT Dutch Auction contract
            const upgradedNFTDutchAuction = await upgrades.upgradeProxy(NFTDutchAuction.address, upgradedNFTDutchAuctionToken);
            
            // Assert that non-owners cannot perform certain actions
            await expect(upgradedNFTDutchAuction.connect(bidder).isOwner()).to.be.revertedWith("Only the contract owner can perform this action.");
            
        })

        // Test to ensure that the upgradeProxy function upgrades the NFTDutchAuction contract successfully
        it("Should upgrade successfully ", async function () {
          const { NFTDutchAuction, bidder } = await loadFixture(deployAuctionFixture);
          const upgradedNFTDutchAuctionToken = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids_v2");

            // Upgrade the NFTDutchAuction contract to the upgradedNFTDutchAuctionToken contract
          const upgradedNFTDutchAuction = await upgrades.upgradeProxy(NFTDutchAuction.address, upgradedNFTDutchAuctionToken);
          
            // Ensure that the version of the upgraded NFTDutchAuction contract is 2
          expect(await upgradedNFTDutchAuction.isVer2()).to.equal(2);
      })

      // Test to ensure that the NFTDutchAuction contract ends the auction and transfers ownership of the NFT after bidding
        it("should end the auction after bidding using NFTDutchAuction", async function () {
            const { NFT, NFTDutchAuction, E20, owner, bidder } = await loadFixture(deployAuctionFixture);

            // Ensure that the bidder has enough E20 tokens to bid
            expect(await E20.balanceOf(bidder.address)).to.equal(2000);
            expect(await NFT.getApproved(1)).to.equal(NFTDutchAuction.address);
            expect(await NFTDutchAuction.initialPrice()).to.equal(2000);
            
            // Fast forward time to simulate the auction ending
            for (let i = 0; i < 15; i++) {
                await network.provider.send("evm_mine");
            }

              // Increase the allowance of the E20 tokens for the NFTDutchAuction contract to bid
            await E20.allowance(E20.address, NFTDutchAuction.address);
            await E20.increaseAllowance(NFTDutchAuction.address, 2000);
            
            await NFTDutchAuction.connect(bidder).bid();
            expect(await NFT.ownerOf(1)).to.equal(bidder.address);
            expect(await E20.balanceOf(bidder.address)).to.equal(0);
            expect(await E20.balanceOf(owner.address)).to.equal(2000);
            expect(await NFTDutchAuction.auctionEnd()).to.equal(true);
        })

        it("should end the auction after bidding using NFTDutchAuctionV2", async function () {
          const { NFT, NFTDutchAuction, E20, owner, bidder } = await loadFixture(deployAuctionFixture);
          const upgradedNFTDutchAuctionToken = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids_v2");

          const upgradedNFTDutchAuction = await upgrades.upgradeProxy(NFTDutchAuction.address, upgradedNFTDutchAuctionToken);
          await NFT.connect(owner).approve(upgradedNFTDutchAuction.address, 1);

          // initial state
          expect(await E20.balanceOf(bidder.address)).to.equal(2000);
          expect(await NFT.getApproved(1)).to.equal(upgradedNFTDutchAuction.address);
          expect(await upgradedNFTDutchAuction.initialPrice()).to.equal(2000);
          expect(await upgradedNFTDutchAuction.isVer2()).to.equal(2);
          // after 10 blocks
          for (let i = 0; i < 15; i++) {
              await network.provider.send("evm_mine");
          }

          // award some allowance to auction
          await E20.allowance(E20.address, upgradedNFTDutchAuction.address);
          await E20.increaseAllowance(upgradedNFTDutchAuction.address, 2000);
          // bid to cause an auction to end
          await upgradedNFTDutchAuction.connect(bidder).bid();
          expect(await NFT.ownerOf(1)).to.equal(bidder.address);
          expect(await E20.balanceOf(bidder.address)).to.equal(0);
          expect(await E20.balanceOf(owner.address)).to.equal(2000);
          expect(await upgradedNFTDutchAuction.auctionEnd()).to.equal(true);
      })
    })
  })