//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

interface IPositions {
    function mint(
        uint256[] memory _positions,
        uint256[] memory _multiplicator,
        address _owner,
        uint256 _size,
        uint256 _strikeUpper,
        uint256 _strikeLower
    ) external returns (uint256);

    function burn(uint256 _positionId) external;

    function getOwner(uint256 _positionId) external view returns (address);

    function getNextId() external view returns (uint256);
}
