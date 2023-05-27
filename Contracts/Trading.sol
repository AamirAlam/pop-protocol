//SPDX-License-Identifier:MIT

// Primary Trading contract for POP

pragma solidity ^0.8.7;

interface IERC20 {
    /**
     * @dev Returns token decimals.
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(
            address(this).balance >= amount,
            "Address: insufficient balance"
        );

        (bool success, ) = recipient.call{value: amount}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data
    ) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return
            functionCallWithValue(
                target,
                data,
                value,
                "Address: low-level call with value failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(
            address(this).balance >= value,
            "Address: insufficient balance for call"
        );
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(
            data
        );
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data
    ) internal view returns (bytes memory) {
        return
            functionStaticCall(
                target,
                data,
                "Address: low-level static call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data
    ) internal returns (bytes memory) {
        return
            functionDelegateCall(
                target,
                data,
                "Address: low-level delegate call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verifies that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}

library SafeERC20 {
    using Address for address;

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(
                oldAllowance >= value,
                "SafeERC20: decreased allowance below zero"
            );
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(
                token,
                abi.encodeWithSelector(
                    token.approve.selector,
                    spender,
                    newAllowance
                )
            );
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(
            data,
            "SafeERC20: low-level call failed"
        );
        if (returndata.length > 0) {
            // Return data is optional
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}

/// @dev Interace to allow interaction between in the Trading contract and the Position contract.
interface IPosition {
    function mint(
        uint256[] memory,
        uint256[] memory,
        address,
        bytes32,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) external returns (uint256, bytes32);

    function burn(uint256, address) external;

    function getPosition(bytes32) external view returns (PositionToken memory);

    function getPositionId(uint256) external view returns (bytes32);
}

/// @dev Interace to allow interaction between in the Trading contract and the Staking ontract.
interface IStaking {

}

/// @notice To enable admin functions
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice For the incremental ids.
import "@openzeppelin/contracts/utils/Counters.sol";

import "./ECDSA.sol";

error POP_InsufficientApprovedAmount();
error POP_IsSequencerFunction();
error POP_InvalidProduct();

/// @notice STRUCTS ==================================

/// @dev PositionToken - Represents a position owned by the trader.
/// @dev For further details look under the CustomERC721.sol file.
struct PositionToken {
    uint256[] position;
    uint256[] multiplicator;
    address owner;
    bytes32 associatedProduct;
    uint256 size;
    uint256 margin;
    uint256 strikeUpper;
    uint256 strikeLower;
    uint256 timestamp;
    bool isOpen;
}

/// @dev Product - Underlying asset or financial instrument that the options contract is based on.
/// Created by the exchange. BPS:"basis points".
/// @param supplyBase The variable q mentioned in the specifications which represent the count of tokens over all the intervals n.
/// @param multiplicatorBase Created to help in the maths involved that affects the tokens at each position based on certain rules.
/// @param limit The current upper bound of valid values in the supplyBase and multiplicatorBased.
/// @param supply Total supply of the given product.
/// @param margin Collateral that a trader must deposit with their broker or exchange in order to open and maintain a leveraged trading position.
/// @param maxLeverage Allowing traders to control a larger position in an underlying asset than the amount of collateral they have put up.
/// @param liquidationThreshold Price change at which an options position will be automatically liquidated or closed out by the platform.
/// @param fee Platform fee.
/// @param interest Premium that a buyer pays to a seller to acquire the right to buy (in the case of a call option) or sell (in the case
/// of a put option) an underlying asset at a predetermined price (the strike price) on or before a specified expiration date.
struct Product {
    uint256[] supplyBase;
    uint256[] multiplicatorBase;
    uint256 limit;
    uint256 supply;
    uint256 margin;
    uint256 maxLeverage; // set to 0 to deactivate product
    uint256 liquidationThreshold; // in bps. 8000 = 80%
    uint256 fee; // In sbps (10^6). 0.5% = 5000. 0.025% = 250
    uint256 interest; // For 360 days, in bps. 5.35% = 535
}

contract POPTrading is Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using Address for address payable;
    using Counters for Counters.Counter;

    /// @notice INTERNAL VARIABLES ===============================================
    uint256 private fundingRateAlpha;

    uint256 public constant DECIMALS = 18;

    Counters.Counter public nextMintRequestId;

    /// @notice Id to The assets
    mapping(bytes32 => Product) public products;
    // mapping(bytes32 => bytes) public productToParameters;

    /// @notice For the PriceFeed()/Oracle
    mapping(bytes32 => bool) public incomingFulfillments;
    mapping(bytes32 => uint256) public fulfilledData;
    mapping(address => address payable) public sponsorToSponsorWallet;

    address public sequencerAddress;
    address public stakingAddress;
    address public vaultAddress;
    IERC20 public paymentToken;
    IPosition public positionContract;

    event MintRequested(
        address indexed user,
        uint256 indexed requestId,
        bytes32 indexed productId,
        uint256 fee,
        uint256 lambdaGenerated,
        uint256 size,
        uint256 strikeLower,
        uint256 strikeUpper
    );

    event BurnRequested(address indexed user, bytes32 indexed positionId);

    modifier onlySequencer() {
        if (_msgSender() != sequencerAddress) revert POP_IsSequencerFunction();
        _;
    }

    modifier validProduct(bytes32 _productId) {
        if (products[_productId].maxLeverage == 0) revert POP_InvalidProduct();
        _;
    }

    constructor(
        address _paymentToken,
        address _positionContract,
        address _sequencer,
        address _staking,
        address _vault
    ) {
        paymentToken = IERC20(_paymentToken);
        positionContract = IPosition(_positionContract);
        sequencerAddress = _sequencer;
        stakingAddress = _staking;
        vaultAddress = _vault;
        nextMintRequestId.increment();
    }

    /// @notice FUNCTIONS =================================================

    function updateSupplyBase() internal {}

    function updateSupplyBaseBatch() internal {}

    /// @notice Responsible for initiating the minting process. Step 1. Step 2 being the Sequencer actually minting the
    /// NFT and the position is then officially/technically open.
    function requestPosition(
        uint256 _strikeLower,
        uint256 _strikeUpper,
        bytes32 _productId,
        uint256 _size,
        uint256 _fee
    ) external validProduct(_productId) {
        // Platform collects.
        uint256 protocolCut = _size * _fee;
        // Vault collects.
        uint256 vaultCut = _size * (1 - _fee);
        // uint256 totalApprovalRequired = stakingCut + vaultCut;

        if (
            paymentToken.allowance(_msgSender(), address(this)) < protocolCut ||
            paymentToken.allowance(_msgSender(), vaultAddress) < vaultCut
        ) revert POP_InsufficientApprovedAmount();

        paymentToken.transferFrom(_msgSender(), address(this), protocolCut);
        paymentToken.transferFrom(_msgSender(), vaultAddress, vaultCut);

        /// @dev The code written below is still under scrutiny,
        uint256 lambda = lambda_calculation(
            _productId,
            _strikeLower,
            _strikeUpper,
            _size,
            _fee
        );

        emit MintRequested(
            _msgSender(),
            nextMintRequestId.current(),
            _productId,
            _fee,
            lambda,
            _size,
            _strikeLower,
            _strikeUpper
        );

        nextMintRequestId.increment();
    }

    function mintPositionSequencer(
        uint256[] memory _positions,
        address _receiver,
        bytes32 _productId,
        uint256 _fee,
        uint256 _size,
        uint256 _margin,
        uint256 _strikeUpper,
        uint256 _strikeLower
    ) external onlySequencer returns (uint256) {
        uint256[] memory _multiplicator = products[_productId]
            .multiplicatorBase;

        (uint256 tokenId, ) = positionContract.mint(
            _positions,
            _multiplicator,
            _receiver,
            _productId,
            _fee,
            _size,
            _margin,
            _strikeUpper,
            _strikeLower
        );
        return tokenId;
    }

    function burnPosition(
        uint256 _positionTokenId,
        uint256 _fraction
    ) external {
        address caller = _msgSender();
        _burnPosition(_positionTokenId, _fraction, caller);
    }

    function _burnPosition(
        uint256 _positionTokenId,
        uint256 _fraction,
        address _caller
    ) internal {
        bytes32 positionId = positionContract.getPositionId(_positionTokenId);
        PositionToken memory currentPosition = positionContract.getPosition(
            positionId
        );
        bytes32 productId = currentPosition.associatedProduct;

        Product memory currentProduct = products[productId];
        uint256[] memory supplyBase = currentProduct.supplyBase;
        uint256[] memory multiplicatorBase = currentProduct.multiplicatorBase;
        uint256[] memory additionalValues;
        uint256 limit = currentProduct.limit;
        uint256 start = currentPosition.strikeLower;
        uint256 end = currentPosition.strikeUpper;

        for (uint256 i = start; i <= end; i++) {
            uint256 toSubtract = (_fraction *
                currentPosition.position[i] *
                multiplicatorBase[i]) / currentPosition.multiplicator[i];
            supplyBase[i] -= toSubtract;
            additionalValues[i] = toSubtract;
        }

        uint256 modifiedM = getM(supplyBase, additionalValues, limit, true);
        uint256 M = getM(supplyBase, additionalValues, limit, false);
        uint256 fee = products[productId].fee;

        uint256 userCut = (modifiedM - M) * (1 - fee);
        uint256 protocolCut = (modifiedM - M) * fee;

        if (paymentToken.allowance(_caller, address(this)) < protocolCut)
            revert POP_InsufficientApprovedAmount();

        paymentToken.transferFrom(_caller, address(this), protocolCut);
        paymentToken.transfer(_caller, userCut);

        positionContract.burn(_positionTokenId, _caller);
    }

    /// @notice GETTER FUNCTIONS ==================================================
    function getProduct(bytes32 id) public view returns (Product memory) {
        return products[id];
    }

    function getM(
        uint256[] memory _supplyBase,
        uint256[] memory _additionalValues,
        uint256 _limit,
        bool _useAdditional
    ) public pure returns (uint256) {
        uint256 sum = 0;

        if (_useAdditional)
            for (uint256 i = 0; i < _limit; i++)
                sum += (_supplyBase[i] + _additionalValues[i]) ** 2;
        else for (uint256 i = 0; i < _limit; i++) sum += (_supplyBase[i]) ** 2;

        return sqrt(sum);
    }

    function getSumFromSupply(
        uint256[] memory _supplyBase,
        uint256 _start,
        uint256 _end
    ) public pure returns (uint256) {
        require(_start <= _end);

        uint256 sum = 0;
        for (uint256 i = _start; i <= _end; i++) {
            sum += _supplyBase[i];
        }
        return (sum);
    }

    function getSlippageEstimate(
        uint256 _ask,
        uint256 _bid,
        uint256 _quantity
    ) external pure returns (uint256) {
        uint256 spread = _ask - _bid;
        uint256 slippageEstimate = spread * _quantity;
        return slippageEstimate;
    }

    /// @dev Should be handled on the front since this will essentially return a fractional value.
    /// @dev Or we can multiply the numerator q(Supply of a token Ti) value with 10**x and divide the return
    /// @dev value with 10**x on the front to get the actual value,
    function getHistogramValue(
        bytes32 _productId
    ) external view returns (uint256) {
        Product memory currentProduct = products[_productId];

        uint256[] memory supplyBase = currentProduct.supplyBase;
        uint256[] memory temp;
        uint256 limit = currentProduct.limit;

        uint currentM = getM(supplyBase, temp, limit, false);

        uint256 numerator = 10 ** DECIMALS * currentProduct.supply;
        uint256 histogramValue = numerator / currentM;
        return histogramValue;
    }

    function lambda_calculation(
        bytes32 _productId,
        uint256 _strikeLower,
        uint256 _strikeUpper,
        uint256 _size,
        uint256 _fee
    ) public view returns (uint256) {
        Product memory currentProduct = products[_productId];

        uint256[] memory supplyBase = currentProduct.supplyBase;
        uint256[] memory temp;
        uint256 limit = currentProduct.limit;

        uint256 denominator = _strikeUpper - _strikeLower + 1;

        uint256 M = getM(supplyBase, temp, limit, false);

        uint256 subSum = getSumFromSupply(
            supplyBase,
            _strikeLower,
            _strikeUpper
        );

        uint256 numerator = sqrt(
            (subSum ** 2) +
                (denominator * ((M + _size * (1 - _fee)) ** 2 - M ** 2))
        ) - subSum;

        uint256 lambda_output = (numerator * 10 ** DECIMALS) / denominator;
        return lambda_output;
    }

    /// @notice Babylonian Method of finding the square root.
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /// @notice CONFIGURATION FUNCTIONS =============================================

    function setPositionContract(address _nft) external onlyOwner {
        positionContract = IPosition(_nft);
    }

    function setSequencer(address _sequencer) external onlyOwner {
        sequencerAddress = _sequencer;
    }

    /// @notice ADMIN FUNCTIONS ====================================================

    function addProduct(
        bytes32 productId,
        Product memory _product
    ) external onlyOwner {
        Product storage product = products[productId];
        require(product.liquidationThreshold == 0, "!product-exists");
        require(_product.liquidationThreshold > 0, "!liqThreshold");

        uint256[] memory multiplicatorBase;
        uint256[] memory supplyBase;
        uint256 _limit = _product.limit;

        for (uint i = 0; i < _limit; i++) {
            supplyBase[i] = 0;
            multiplicatorBase[i] = 1;
        }

        products[productId] = Product({
            supplyBase: supplyBase,
            multiplicatorBase: multiplicatorBase,
            limit: _product.limit,
            supply: _product.supply,
            margin: _product.margin,
            maxLeverage: _product.maxLeverage,
            fee: _product.fee,
            interest: _product.interest,
            liquidationThreshold: _product.liquidationThreshold
        });
        // productToParameters[productId] = parameters;
    }

    /// @notice Can be used to discontinue an asset by setting the maxLeverage to 0.
    function updateProduct(
        bytes32 productId,
        Product memory _product
    )
        external
        // bytes memory parameters
        onlyOwner
    {
        Product storage product = products[productId];
        require(product.liquidationThreshold > 0, "!product-does-not-exist");
        product.supply = _product.supply;
        product.margin = _product.margin;
        product.maxLeverage = _product.maxLeverage;
        product.fee = _product.fee;
        product.interest = _product.interest;
        product.liquidationThreshold = _product.liquidationThreshold;
    }

    fallback() external payable {}

    receive() external payable {}
}
