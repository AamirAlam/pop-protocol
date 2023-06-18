//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "./interfaces/IPositions.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

error ERR_POP_Positions_CallerNotTheTradingContract();
error ERR_POP_Positions_PositionIdOutOfBounds();
error ERR_POP_Positions_PositionNotActive();

/// @notice PositionToken - Trader's exposure to the underlying asset or financial instrument that the options
/// contract is based on.
/// @param timestamp The unix epoch when the position was created.

struct PositionToken {
    uint256[] position;
    uint256[] multiplicator;
    address owner;
    uint256 fee;
    uint256 size;
    uint256 strikeUpper;
    uint256 strikeLower;
    uint256 timestamp;
    bool isOpen;
}

contract POP_Positions is Ownable, ERC721, IPositions {
    using Counters for Counters.Counter;
    Counters.Counter private nextTokenId;

    address public popTradingContract = address(0);

    bytes32 public immutable PARENT_PRODUCT;

    mapping(uint256 => PositionToken) private idToPosition;

    event PositionStatus(
        address indexed owner,
        uint256 indexed positionId,
        bool isOpen
    );

    modifier onlyPOP_Trading() {
        if (_msgSender() != popTradingContract)
            revert ERR_POP_Positions_CallerNotTheTradingContract();
        _;
    }

    modifier validId(uint256 _positionId) {
        if (nextTokenId.current() <= _positionId)
            revert ERR_POP_Positions_PositionIdOutOfBounds();
        if (!idToPosition[_positionId].isOpen)
            revert ERR_POP_Positions_PositionNotActive();
        _;
    }

    constructor(
        bytes32 _parentProduct,
        string memory _productName,
        string memory _productSymbol
    ) ERC721(_productName, _productSymbol) {
        nextTokenId.increment();
        PARENT_PRODUCT = _parentProduct;
    }

    function getNextId() external view returns (uint256) {
        return nextTokenId.current();
    }

    function getPosition(
        uint256 _positionId
    ) external view returns (PositionToken memory) {
        return idToPosition[_positionId];
    }

    function mint(
        uint256[] memory _positions,
        uint256[] memory _multiplicator,
        address _owner,
        uint256 _size,
        uint256 _strikeUpper,
        uint256 _strikeLower
    ) external onlyPOP_Trading returns (uint256) {
        PositionToken memory userToken;

        userToken.position = _positions;
        userToken.multiplicator = _multiplicator;
        userToken.owner = _owner;
        userToken.size = _size;
        userToken.strikeUpper = _strikeUpper;
        userToken.strikeLower = _strikeLower;
        userToken.timestamp = block.timestamp;
        userToken.isOpen = true;

        uint256 positionId = nextTokenId.current();

        idToPosition[positionId] = userToken;
        _mint(_owner, positionId);

        nextTokenId.increment();

        emit PositionStatus(_owner, positionId, true);

        return positionId;
    }

    function getOwner(uint256 _positionId) external view returns (address) {
        return _ownerOf(_positionId);
    }

    function burn(
        uint256 _positionId
    ) external override onlyPOP_Trading validId(_positionId) {
        PositionToken storage currentPosition = idToPosition[_positionId];

        currentPosition.isOpen = false;
        _burn(_positionId);

        emit PositionStatus(currentPosition.owner, _positionId, false);
    }

    function update(
        uint256 _positionId,
        PositionToken memory _updatedPositionParams
    ) external onlyPOP_Trading {}

    function setTradingContract(address _tradingContract) external onlyOwner {
        popTradingContract = _tradingContract;
    }

    // * receive function
    receive() external payable {}

    // * fallback function
    fallback() external payable {}
}
