// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/// @title pop-protocol-v1 vault and staking contract
/// @author vanshwassan
/// @notice Users can stake tokenStaked and earn rewards with rewardToken.
/// @notice Supports variable APR.
/// @notice NOT AUDITED YET!
/// @notice NOT TESTED YET!
/// @notice WIP

/// @notice ERC20 openzeppelin implementation
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract StakingContract {
    address public tokenStaked;                 /// @notice POP Token (the token that needs to be staked)
    address public rewardToken;                 /// @notice USDC Token (the token that users get rewarded in)
    address public tradingContract;             /// @notice address for the main trading contract

    uint256 public currentAPR;                  /// @notice current APR. Gets updated every week
    uint256 public currentStakingTarget;        /// @notice current staking target
    uint256 public stakingDuration = 7 days;    /// @notice staking duration 
    uint256 public lastEpochEndTime;            /// @notice gets updated every week

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public lastStakedEpoch;
    mapping(address => uint256) public rewardsEarned;
    mapping(address => uint256) public unstakeInitiatedEpoch;

    constructor(address _tokenStaked, address _rewardToken, address _tradingContract, uint256 _initialAPR, uint256 _initialStakingTarget) {
        tokenStaked = _tokenStaked;
        rewardToken = _rewardToken;
        tradingContract = _tradingContract;
        currentAPR = _initialAPR;
        currentStakingTarget = _initialStakingTarget;
        lastEpochEndTime = block.timestamp;
    }

    /// @notice onlyTradingContract modifier to allow only trading contract to access certain functions
    modifier onlyTradingContract() {
        require(msg.sender == tradingContract, "Caller not trading contract!");
        _;
    }

    /// @notice sendFeeToVault() method to send USDC fee from trading contract to the vault/pool
    function sendFeeToVault(uint256 amount) external onlyTradingContract {
        require(amount > 0, "Fee must be greater than zero");
        require(IERC20(rewardToken).allowance(msg.sender, address(this)) > 0, "Allowance too low!");
        IERC20(rewardToken).transferFrom(msg.sender, address(this), amount);
    }

    /// @notice updateRewards() modifier to update the rewards
    // modifier updateRewards(address staker) {
    //     uint256 stakerStakedAmount = stakedAmount[staker];
    //     uint256 stakerLastStakedEpoch = lastStakedEpoch[staker];

    //     if (stakerStakedAmount > 0) {
    //         uint256 reward = calculateReward(stakerStakedAmount, stakerLastStakedEpoch);
    //         rewardsEarned[staker] += reward;
    //     }

    //     _;
    // }

    /// @notice calculateReward() to calulcate the reward for each staker
    /// @dev should be private, just gonna check how this works
    function calculateReward(uint256 amount, uint256 _lastStakedEpoch) internal view returns (uint256) {
        uint256 epochsPassed = (block.timestamp - _lastStakedEpoch) / stakingDuration;
        console.log("passed epoch: %s", epochsPassed);
        uint256 totalRewards = (amount * currentAPR * epochsPassed) / 100;
        console.log("calculateReward totalRewards: %s", totalRewards);
        // this means 7 days have passed. user starts earning rewards 7 days after staking
        if (epochsPassed >= 1) {
            return totalRewards;
        }
        else return 0;
    }

    /// @dev not the best approach, still testing
    function updateFinalRewards(address _staker) external {
        uint256 stakerStakedAmount = stakedAmount[_staker];
        uint256 stakerLastStakedEpoch = lastStakedEpoch[_staker];

        if (stakerStakedAmount > 0) {
            uint256 reward = calculateReward(stakerStakedAmount, stakerLastStakedEpoch);
            rewardsEarned[_staker] = reward;
        }
    }

    /// @notice stake() to stake POP Tokens
    function stake(uint256 amount) external {
        require(amount > 0, "Invalid staking amount");
        require(IERC20(tokenStaked).allowance(msg.sender, address(this)) > 0, "Allowance too low!");

        IERC20(tokenStaked).transferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
        lastStakedEpoch[msg.sender] = block.timestamp;
    }

    /// @notice initiateUnstake() to initiate unstake.
    function initiateUnstake() external {
        require(stakedAmount[msg.sender] > 0, "No staked amount");

        unstakeInitiatedEpoch[msg.sender] = block.timestamp;
    }

    /// @notice unstake() will allow users to unstake POP tokens after 7 day unstake epoch
    function unstake() external {
        require(unstakeInitiatedEpoch[msg.sender] > 0, "Unstake not initiated");
        require(block.timestamp >= unstakeInitiatedEpoch[msg.sender] + stakingDuration, "Lock-up period not elapsed");

        uint256 amount = stakedAmount[msg.sender];
        require(amount > 0, "No staked amount");

        IERC20(tokenStaked).transfer(msg.sender, amount);
        stakedAmount[msg.sender] = 0;
        lastStakedEpoch[msg.sender] = 0;
        unstakeInitiatedEpoch[msg.sender] = 0;
        if (stakedAmount[msg.sender] > 0) {
            uint256 reward = calculateReward(stakedAmount[msg.sender], lastStakedEpoch[msg.sender]);
            rewardsEarned[msg.sender] = reward;
        }
    }

    /// @notice claimRewards() to claim any available rewards
    function claimRewards() external {
        require(rewardsEarned[msg.sender] > 0, "No rewards!");
        require(stakedAmount[msg.sender] > 0, "No tokens staked!");
        require(IERC20(rewardToken).balanceOf(address(this)) > rewardsEarned[msg.sender], "Not enough USDC in vault");
        require(IERC20(rewardToken).transfer(msg.sender, rewardsEarned[msg.sender]), "Transfer failed");
        
        rewardsEarned[msg.sender] = 0;
    }

    /// @notice updateEpoch() IMPORTANT needs to be updated every time the epoch ends.
    /// @dev can use gelato to automate calling this method every 7 days?
    function updateEpoch() external {
        require(block.timestamp >= lastEpochEndTime + stakingDuration, "Epoch duration not elapsed");

        if (totalStakedAmount() >= currentStakingTarget) {
            currentAPR = (currentAPR > 0) ? currentAPR - 1 : 0;
            currentStakingTarget = (currentStakingTarget * 110) / 100;
        } else {
            currentAPR += 1;
            currentStakingTarget = (currentStakingTarget * 90) / 100;
        }
        lastEpochEndTime = block.timestamp;
    }

    /// @notice totalStakedAmount() return total POP staked
    function totalStakedAmount() public view returns (uint256) {
        return IERC20(tokenStaked).balanceOf(address(this));
    }

    /// @notice totalUSDCVaultBalance() return total USDC in the vault
    function totalUSDCVaultBalance() external view returns (uint256) {
        return IERC20(rewardToken).balanceOf(address(this));
    }

    function totalPopStaked() external view returns (uint256) {
        return stakedAmount[address(this)];
    }
    
    function checkRewards() external view returns (uint256) {
        return rewardsEarned[msg.sender];
    }

    // Allow the contract to receive the reward token
receive() external payable {
    require(msg.sender == rewardToken, "Invalid sender");
}

}