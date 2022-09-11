const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert } = require("chai");
describe("FundMe", async () => {
    let fundMe, deployer, mockV3Aggregator;
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
});
