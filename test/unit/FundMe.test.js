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

    describe("withdraw", async () => {
        //before each function to first fund the contract before we can test withdraw
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async () => {
            //arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            //act
            const transcationResponse = await fundMe.withdraw();
            const trnasactionReciept = await transcationResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = trnasactionReciept;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //assert
            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), //since starting fundMe balance will be of type BigNumber using just '+' won't work
                //obviously the withdrawee will spend bit of gas to carry the transaction
                endingDeployerBalance.add(gasCost).toString()
            );
        });
        it("allows us to withdraw with multiple funders", async () => {
            //arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++) {
                //created new fundMe object since the one created earlier is already connected to deployer
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                );
                await fundMeConnectedContract.fund({ value: sendValue });
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //act
            const transcationResponse = await fundMe.withdraw();
            const trnasactionReciept = await transcationResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = trnasactionReciept;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //assert
            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), //since starting fundMe balance will be of type BigNumber using just '+' won't work
                //obviously the withdrawee will spend bit of gas to carry the transaction
                endingDeployerBalance.add(gasCost).toString()
            );

            // Make sure that the funders are reset properly
            await expect(fundMe.funders(0)).to.be.reverted;

            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.addressToAmountFunded(accounts[i].address),
                    0
                );
            }
        });

        it("only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(attackerConnectedContract.withdraw()).to.be.reverted;
            // to.be.revertedWith("FundMe__NotOwner"); not working find out why??
        });
    });
});
