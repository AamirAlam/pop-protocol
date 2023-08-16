//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SequencerArray is Ownable {
    bytes32 private primaryServiceHash;
    uint256 private primaryUpdatedTimestamp;
    bytes32 private secondaryServiceHash;
    uint256 private secondaryUpdatedTimestamp;

    event updatedPrimary(
        bytes32 indexed prev,
        bytes32 indexed updated,
        uint256 indexed timestamp
    );
    event updatedSecondary(
        bytes32 indexed prev,
        bytes32 indexed updated,
        uint256 indexed timestamp
    );

    constructor() {}

    function getLatest() external view returns (bytes32) {
        if (
            primaryUpdatedTimestamp > secondaryUpdatedTimestamp &&
            primaryServiceHash != bytes32(0)
        ) return primaryServiceHash;
        else return secondaryServiceHash;
    }

    function updatePrimary(bytes32 _updated) external onlyOwner {
        bytes32 old = primaryServiceHash;
        primaryServiceHash = _updated;
        primaryUpdatedTimestamp = block.timestamp;
        emit updatedPrimary(old, primaryServiceHash, primaryUpdatedTimestamp);
    }

    function updateSecondary(bytes32 _updated) external onlyOwner {
        bytes32 old = secondaryServiceHash;
        secondaryServiceHash = _updated;
        secondaryUpdatedTimestamp = block.timestamp;
        emit updatedSecondary(
            old,
            secondaryServiceHash,
            secondaryUpdatedTimestamp
        );
    }
}
