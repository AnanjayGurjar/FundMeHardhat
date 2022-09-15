// SPDX-License-Identifier: MIT

// Tried following style guide of solidity to enhance the readability of code
// https://docs.soliditylang.org/en/latest/style-guide.html

//Pragma
pragma solidity ^0.8.8;

//Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

//Error codes
error FundeMe__NotOwner();

//Interfaces, Libraries, Constracts

//NatSpec Format
/** @title A contract for crowd funding
 *  @author Ananjay gurjar
 *  @notice This constract is to demo a sample funding contract
 *  @dev This implements price feed as our library
 */
contract FundMe {
    //Type Declarations
    using PriceConverter for uint256;

    // State Variables
    //look for evm-opcodes, it suggest that saving a word to storage takes a ton of gas, hence it is best convention
    // to append 's_' infront of variables so we know we are working with storage variables
    mapping(address => uint256) public s_addressToAmountFunded;
    address[] public s_funders;
    address public immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10**18;
    AggregatorV3Interface public s_priceFeed;

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundeMe__NotOwner();
        _;
    }

    // Functions
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /** @notice This constract is to demo a sample funding contract
     *   @dev This implements price feed as our library
     */
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        // here instead of constantly reading from storage we can read it once in the memory and then use it
        address[] memory funders = s_funders;
        //Also, note that you can't put mappings in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }
}
