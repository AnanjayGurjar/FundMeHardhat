const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
describe("FundMe", async () => {
    let fundMe, deployer, mockV3Aggregator;
    // const sendValue = "1000000000000000000";    //1 eth
    const sendValue = ethers.utils.parseEther("1");
    beforeEach(async () => {
        // const accounts = await ethers.getSigners();
        // const accountZero = accounts[0];
        deployer = (await getNamedAccounts()).deployer;

        //fixture allow us to run our entire deploy folder with as many tags as we want
        //thus this function runs through our deploy scripts on our local network and deploy all of our networks
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer); //getContract will give us the most recently deployed "FundMe" contract
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    describe("constructor", async () => {
        it("set the aggregator address correctly", async () => {
            const response = await fundMe.priceFeed();
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            );
        });
        it("Updates the amound funded data structure", async () => {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.addressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer);
        });
    });
});
