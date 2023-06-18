//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @notice PositionToken - Trader's exposure to the underlying asset or financial instrument that the options
/// contract is based on.
/// @param timestamp The unix epoch when the position was created.

struct PositionToken {
    uint256[] position;
    uint256[] multiplicator;
    address owner;
    bytes32 associatedProduct;
    uint256 fee;
    uint256 size;
    uint256 strikeUpper;
    uint256 strikeLower;
    uint256 timestamp;
    bool isOpen;
}

error POP_CallerNotTheTradingContract();
error POP_TokenIdOutOfBounds();

contract PopPositions is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private nextTokenId;

    mapping(uint256 => bytes32) private idToPosition;
    mapping(bytes32 => PositionToken) private positions;

    address public popTradingContract = address(0);

    event PositionStatus(
        address indexed owner,
        bytes32 indexed positionId,
        bool isOpen
    );

    modifier onlyPOPTrading() {
        if (_msgSender() != popTradingContract)
            revert POP_CallerNotTheTradingContract();
        _;
    }

    modifier validId(uint256 _tokenId) {
        if (nextTokenId.current() <= _tokenId) revert POP_TokenIdOutOfBounds();
        _;
    }

    constructor(address) ERC721("PopPostions", "PPOS") {
        nextTokenId.increment();
    }

    function getNextId() external view returns (uint256) {
        return nextTokenId.current();
    }

    function getPosition(
        bytes32 _positionId
    ) external view returns (PositionToken memory) {
        return positions[_positionId];
    }

    function getPositionId(uint256 _tokenId) external view returns (bytes32) {
        return idToPosition[_tokenId];
    }

    function mint(
        uint256[] memory _positions,
        uint256[] memory _multiplicator,
        address _owner,
        bytes32 _productId,
        uint256 _fee,
        uint256 _size,
        uint256 _strikeUpper,
        uint256 _strikeLower
    ) external onlyPOPTrading returns (uint256, bytes32) {
        PositionToken memory userToken;

        userToken.position = _positions;
        userToken.multiplicator = _multiplicator;
        userToken.owner = _owner;
        userToken.associatedProduct = _productId;
        userToken.fee = _fee;
        userToken.size = _size;
        userToken.strikeUpper = _strikeUpper;
        userToken.strikeLower = _strikeLower;
        userToken.timestamp = block.timestamp;
        userToken.isOpen = true;

        bytes memory encodedData = abi.encode(
            _msgSender(),
            _owner,
            block.timestamp
        );

        bytes32 generatedId;
        assembly {
            generatedId := mload(add(encodedData, 32))
        }

        uint256 tokenId = nextTokenId.current();

        positions[generatedId] = userToken;
        idToPosition[tokenId] = generatedId;
        _mint(_owner, tokenId);

        nextTokenId.increment();

        emit PositionStatus(_owner, generatedId, true);

        return (tokenId, generatedId);
    }

    function burn(
        uint256 _tokenId,
        address _caller
    ) external onlyPOPTrading validId(_tokenId) {
        require(_msgSender() == popTradingContract);

        bytes32 positionId = idToPosition[_tokenId];
        PositionToken storage currentPosition = positions[positionId];

        require(currentPosition.owner == _caller, "Not the position owner.");

        currentPosition.isOpen = false;
        _burn(_tokenId);

        emit PositionStatus(_caller, positionId, false);
    }

    function setTradingContract(address _tradingContract) external onlyOwner {
        popTradingContract = _tradingContract;
    }

    // * receive function
    receive() external payable {}

    // * fallback function
    fallback() external payable {}
}
