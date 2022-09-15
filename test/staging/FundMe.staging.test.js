//tests which we run after we deploy on testnet
const { deployments, ethers, network } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

developmentChain.includes(network.name)
    ? describe.skip //we are in local network
    : describe("FundMe", async () => {
          let fundMe, deployer, mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1");
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;

              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              //now like we did in unit test we don't need to deploy this contract as on testnet we'll assume that it is already deployed
              //also we won't require mock
          });

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
