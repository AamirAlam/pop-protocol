// this contract is a placeholder for the OEV functionality, currently this contract is using chainlink,
// however when OEV goes live from API3 this contract will be updated to use that.

pragma solidity ^0.8.7;

interface AggregatorV2V3Interface {
    function latestRound() external view returns (uint256);

    function decimals() external view returns (uint8);

    function getAnswer(uint256 roundId) external view returns (int256);

    function getTimestamp(uint256 roundId) external view returns (uint256);

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract Oracle {

    address public owner;
    bytes32[] public aggregatorKeys;
    mapping(bytes32 => AggregatorV2V3Interface) public aggregators;
    mapping(bytes32 => uint8) public productIdDecimals;

    constructor() {
        owner = msg.sender;
        aggregators[0x4554482d55534400000000000000000000000000000000000000000000000000] = AggregatorV2V3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
    }

    function getPriceFromAggregator(bytes32 productId) public returns (uint) {
        AggregatorV2V3Interface aggregator = aggregators[productId];
        bytes memory payload = abi.encodeWithSignature("latestRoundData()");
        (bool success, bytes memory returnData) = address(aggregator).staticcall(payload);
        if (success) {
            (, int256 answer, , uint256 updatedAt, ) =
                abi.decode(returnData, (uint80, int256, uint256, uint256, uint80));
            return  _formatAggregatorAnswer(productId, answer);
        } else {
            return 0;
        }
    }

    function _formatAggregatorAnswer(bytes32 productId, int256 rate) internal view returns (uint) {
        require(rate >= 0, "Negative rate not supported");
        uint decimals = productIdDecimals[productId];
        uint result = uint(rate);
        if (decimals == 0 || decimals == 18) {
        } else if (decimals < 18) {
            uint multiplier = 10**(18 - decimals);
            result = result * (multiplier);
        } else if (decimals > 18) {
            uint divisor = 10**(decimals - 18);
            result = result / (divisor);
        }
        return result;
    }

    function addAggregator(bytes32 productId, address aggregatorAddress) external onlyOwner {
        AggregatorV2V3Interface aggregator = AggregatorV2V3Interface(aggregatorAddress);
        uint8 decimals = aggregator.decimals();
        require(decimals <= 27, "Aggregator decimals should be lower or equal to 27");
        if (address(aggregators[productId]) == address(0)) {
            aggregatorKeys.push(productId);
        }
        aggregators[productId] = aggregator;
        productIdDecimals[productId] = decimals;
    }

	modifier onlyOwner() {
		require(msg.sender == owner, "!owner");
		_;
	}
}