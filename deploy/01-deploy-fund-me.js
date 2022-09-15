//hardhat deploy calls functin that we specify in the script

// module.exports = async (hre) =>{
//     const { getNamedAccounts, deployments } = hre;
// }
// or it can be written as shown below

const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { ConstructorFragment } = require("@ethersproject/abi");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //mock-contracts
    //if the contract doesn't exist we deploy a minimal version of it for our local testing

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress;
    if (developmentChain.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }
    const contructorArgs = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: contructorArgs, //arguments to the consturctor of the contract. In this case it is price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    //adding the function to auto verify
    if (
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, contructorArgs);
    }

    log("-------------------------------------------------");
};
module.exports.tags = ["all", "fundme"];
