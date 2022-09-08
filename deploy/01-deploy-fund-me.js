//hardhat deploy calls functin that we specify in the script

// module.exports = async (hre) =>{
//     const { getNamedAccounts, deployments } = hre;
// } 
// or it can be written as shown below

module.exports = async ({ getNamedAccounts, deployments }) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
}