//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;

/// @title POP-Protocol-v1 Trading Contract.
/// @author Anuj Tanwar aka br0wnD3v

/// @notice Root contract to enable the users to :
/// Initiate the 'Minting' of Perpetual positions.
/// Initiate the 'Burning' of Perpetual positions if exists.
/// @notice Operations shifted to the Sequencer :
/// Minting of the position requested by the user.
/// Burning of the position requested by the user.

/// @notice In Testing Phase.
/// @notice Not Audited.

import "./Positions.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice All the relevant error codes.
error ERR_POP_Trading_InsufficientApprovedAmount();
error ERR_POP_Trading_IsSequencerFunction();
error ERR_POP_Trading_SequencerSignatureInvalid();
error ERR_POP_Trading_InvalidProductId();
error ERR_POP_Trading_TokenTransferFailed();
error ERR_POP_Trading_UserMintRequestIsInvalid();
error ERR_POP_Trading_UserBurnRequestIsInvalid();
error ERR_POP_Trading_NotThePositionOwner();
error ERR_POP_Trading_NotAnOperator();
error ERR_POP_Trading_InvalidIntervalSupplyRatio();

/// @notice Structure that represents a Minting Request initiated by the user and holds relevant info.
/// @param receiver The address that initiated the request.
/// @param productId The product an address is wanting to purchase.
/// @param positionId The token id of the minted position at the assoociated position contract of a product.
/// @param size Total tokens they want to buy.
/// @param strikeLower The lower limit of the price range they want to buy at.
/// @param strikeUpper The upper limit of the price range they want to buy at.
/// @param isFullFilled Bool to check if the mint was confirmed by the sequencer and the position is open.
struct MintRequest {
    address receiver;
    bytes32 productId;
    uint256 positionId;
    uint256 size;
    uint256 strikeLower;
    uint256 strikeUpper;
    uint256 totalFee;
    bool isFullFilled;
}

/// @notice Structure that represents a Burning Request initiated by the user and holds relevant info.
/// @param burner The address that initiated the burn.
/// @param productId The product in question.
/// @param positionId The respective position that the person is trying to burn
/// @param totalFee The calculated fee. Requires some mathematical calculation therefore might need sequencer's help.
/// @param toReturnFee The mentioned fee payed back to the owner of position when the position is burned.
/// @param isFullFilled To check if the burn was successful.
struct BurnRequest {
    address burner;
    bytes32 productId;
    uint256 positionId;
    uint256 totalFee;
    uint256 toReturnFee;
    bool isFullFilled;
}

/// @dev Product - Underlying asset or financial instrument that the options contract is based on.
/// Created by the exchange. BPS:"basis points".
/// @param supplyBase The variable q mentioned in the specifications which represent the count of tokens over all the intervals n.
/// @param multiplicatorBase Created to help in the maths involved that affects the tokens at each position based on certain rules.
/// @param minPrice The lower bound of the price range.
/// @param maxPrice The upper bound of the price range.
/// @param intervals The current upper bound of valid values in the supplyBase and multiplicatorBase ie the limit of say Qn.
/// @param totalSupply Total supply of the given product. Sum of supplyBase.
/// @param margin Collateral that a trader must deposit with their broker or exchange in order to open and maintain a leveraged trading position.
/// @param fee The fee for a given product. Is different for each product.
/// @param positionContract The contract address that represents a given product. Is an ERC721.
struct Product {
    uint256[] supplyBase;
    uint256[] multiplicatorBase;
    uint256 minPrice;
    uint256 maxPrice;
    uint256 intervals;
    uint256 totalSupply;
    uint256 margin; // We don't need this since we have the cuts calculated in the yellow paper
    uint256 fee; // In sbps (10^6). 0.5% = 5000. 0.025% = 250
    address positionContract;
}

contract POP_Trading is Ownable, ReentrancyGuard {
    /// VARIABLES ==========================================================

    using Counters for Counters.Counter;

    /// @notice To the get the next mint/burn request id which hasn't been used before.
    /// @notice Each unique id is attached with a MintRequest/BurnRequest struct.
    Counters.Counter public nextMintRequestId;
    Counters.Counter public nextBurnRequestId;

    uint256 public constant DECIMALS = 18;

    /// @notice All the associated contracts the Trading contract interacts with in some form.
    address public sequencerAddress;
    address public vaultStakingAddress;

    /// @notice USDC preferrably.
    IERC20 public paymentToken;

    /// @notice Product Id -> Unique Product. Product being the asset being sold on the platform.
    mapping(bytes32 => Product) public products;

    /// @notice Product Id -> Position Contract Address. Each new product when created also deploys an ERC721 too.
    /// @notice Having a single contract for every position would create chaos since its will be harder to
    /// manage down the line and really hard to scale.
    mapping(bytes32 => address) public productToPositionContract;

    /// @notice To track incoming mint/burn requests. Initiated by the user. Uses the
    /// nextMintRequestId/nextBurnRequestId to map each new id with a respective struct.
    mapping(uint256 => MintRequest) public mintRequestIdToStructure;
    mapping(uint256 => BurnRequest) public burnRequestIdToStructure;

    /// @notice Will make sure one signature can't be used again and again and make false requests.
    /// @notice Each time a burn fee is calculated a unique signature is also created.
    mapping(bytes32 => bool) public signatureUsed;

    /// @notice EVENTS ======================================================
    /// @notice Emitted when user wants to buy a position. Is read by the sequencer.
    /// @param user The address initiating the mint,
    /// @param requestId Unique id for each new mint request.
    /// @notice When the request is fulfilled they get a position id which belongs to the respective position contract
    /// associated with the given product.
    event MintRequested(address indexed user, uint256 indexed requestId);

    /// @notice Emitted when user wants to sell a position. Is read by the sequencer.
    /// @param user The address wishing to sell their position.
    /// @param requestId The associated id for each new burn request.
    event BurnRequested(address indexed user, uint256 indexed requestId);

    /// @notice Used to track all the created products. Can be filtered at the front by the limit variable.
    /// @param id A unique id alloted to them.
    /// @param name The name given to the product.
    /// @param symbol The symbol given to the product.
    /// @param product The struct that defines the product.
    event ProductAdded(
        bytes32 indexed id,
        bytes32 indexed name,
        bytes32 indexed symbol,
        Product product
    );

    /// @notice Used to track the current activity for a given user.
    /// @param owner The trader in question.
    /// @param productId The unique identifier for the product.
    /// @param positionId The unique identifier for the position opened at the product's ERC721.
    /// @param status The latest status for a PPP. The valid values are :
    /// Mint Queue - 1
    /// Open  - 2
    /// Burn Queue - 3
    /// Burned - 4

    event PositionStatus(
        address indexed owner,
        bytes32 indexed productId,
        uint256 indexed positionId,
        uint256 mintRequestId,
        uint256 burnRequestId,
        uint256 status
    );
    /// MODIFIERS ===========================================================

    modifier isOperator() {
        if (_msgSender() != sequencerAddress && _msgSender() != owner())
            revert ERR_POP_Trading_NotAnOperator();
        _;
    }

    /// @dev Functions only to be called by the sequencerAddress.
    modifier onlySequencer() {
        if (_msgSender() != sequencerAddress)
            revert ERR_POP_Trading_IsSequencerFunction();
        _;
    }

    /// @dev Check if the provided productId is valid or not.
    modifier validProduct(bytes32 _productId) {
        if (products[_productId].intervals == 0)
            revert ERR_POP_Trading_InvalidProductId();
        _;
    }

    /// @dev Check if the given position even exists for a given prodcut.
    modifier validPosition(bytes32 _productId, uint256 _positionId) {
        if (products[_productId].intervals == 0)
            revert ERR_POP_Trading_InvalidProductId();

        IPositions positionContract = IPositions(
            productToPositionContract[_productId]
        );
        uint256 currentUpper = positionContract.getNextId();
        if (currentUpper <= _positionId)
            revert ERR_POP_Positions_PositionIdOutOfBounds();
        _;
    }

    /// CONTRACT STARTS ===================================================

    constructor(
        address _paymentToken,
        address _sequencer,
        address _vaultStaking
    ) {
        paymentToken = IERC20(_paymentToken);
        sequencerAddress = _sequencer;
        vaultStakingAddress = _vaultStaking;

        nextMintRequestId.increment();
        nextBurnRequestId.increment();
    }

    /// ===================================================================

    /// @dev The mint function is a 2-Step procedure and burn is a 2-Step procedure too.

    /// @notice Step 1 being the user sending a request to mint the position which requires them approving a fixed
    /// amount of tokens based on the fee for the asset and the size they are looking to buy.
    /// @notice Step 2 being the Sequencer minting the NFT on behalf of the user and is now officially/technically open.

    /// @notice Responsible for initiating the minting process.
    /// @param _productId The asset they are willing to buy.
    /// @param _size The amount of tokens they want to buy.
    /// @param  _strikeLower The lower limit of the price range they want to buy at.
    /// @param  _strikeUpper The upper limit of the price range they want to buy at.
    function requestPosition(
        bytes32 _productId,
        uint256 _size,
        uint256 _strikeLower,
        uint256 _strikeUpper
    ) external validProduct(_productId) nonReentrant returns (uint256) {
        uint256 fee = products[_productId].fee;

        require(
            _strikeLower < products[_productId].intervals &&
                _strikeUpper < products[_productId].intervals,
            "Strike price out of bounds."
        );

        /// @dev Need to use something with a decimal value since we cant directly use 1 as decimal values are discarded.
        uint256 protocolCut = _size * fee;
        uint256 vaultCut = _size * (10 ** 6 - fee);

        if (
            paymentToken.allowance(_msgSender(), address(this)) <
            protocolCut + vaultCut
        ) revert ERR_POP_Trading_InsufficientApprovedAmount();
        bool success = paymentToken.transferFrom(
            _msgSender(),
            address(this),
            protocolCut + vaultCut
        );
        if (!success) revert ERR_POP_Trading_TokenTransferFailed();
        success = paymentToken.transfer(vaultStakingAddress, vaultCut);
        if (!success) revert ERR_POP_Trading_TokenTransferFailed();

        /// The position id is later updated when the position is actually minted by the sequencer.
        MintRequest memory associatedRequest = MintRequest({
            receiver: _msgSender(),
            productId: _productId,
            positionId: 0,
            size: _size,
            strikeLower: _strikeLower,
            strikeUpper: _strikeUpper,
            totalFee: protocolCut + vaultCut,
            isFullFilled: false
        });

        mintRequestIdToStructure[
            nextMintRequestId.current()
        ] = associatedRequest;

        /// This event will be used to contruct the params when the sequencer will be minting the position.
        emit MintRequested(_msgSender(), nextMintRequestId.current());
        emit PositionStatus(
            _msgSender(),
            _productId,
            0,
            nextMintRequestId.current(),
            0,
            1
        );

        nextMintRequestId.increment();

        return nextMintRequestId.current() - 1;
    }

    /// @notice The function called by the sequencer to mint the position.
    /// @notice RequestId is always associated to an address and this is useful if the sequencer keys are stolen.
    /// Will disable infinite minting/burning of the positions and only allow those actually initiated by a
    /// legitimate user and require them to pay a fee.
    /// @param _requestId The associated mint request Id.
    /// @param _positions The supply array provided by the sequencer after performing the functions mentioned in the spec sheet.
    function mintPositionSequencer(
        uint256 _requestId,
        uint256[] memory _positions
    ) external onlySequencer nonReentrant returns (uint256) {
        MintRequest storage associatedRequest = mintRequestIdToStructure[
            _requestId
        ];
        if (
            associatedRequest.isFullFilled ||
            associatedRequest.receiver == address(0)
        ) revert ERR_POP_Trading_UserMintRequestIsInvalid();

        IPositions positionContract = IPositions(
            productToPositionContract[associatedRequest.productId]
        );

        Product storage associatedProduct = products[
            associatedRequest.productId
        ];

        uint256 positionId = positionContract.mint(
            _positions,
            associatedProduct.multiplicatorBase,
            associatedRequest.receiver,
            associatedRequest.size,
            associatedRequest.strikeUpper,
            associatedRequest.strikeLower
        );

        /// The position id is updated now and is linked with the request.
        associatedRequest.positionId = positionId;
        associatedRequest.isFullFilled = true;

        emit PositionStatus(
            associatedRequest.receiver,
            associatedRequest.productId,
            positionId,
            _requestId,
            0,
            2
        );

        return positionId;
    }

    /// @notice Step 1. The user initiates the request. This will including a signature being sent in the txn itself
    /// to make sure the txn was framed by the sequencer and was signed by the person requesting it.
    /// @notice Step 2. The sequencer reads the burn requested and finally burns the position on behalf of the user.

    /// @notice Used by the caller to request the burning of a given position.
    /// @param _productId The product they are looking to sell.
    /// @param _positionId The position that pinpoints the exact position.

    /// @dev The combination of both the params acts like a Primary Key seen in RDBMS.
    function requestBurn(
        bytes32 _productId,
        uint256 _positionId,
        bytes32 _sequencerSignature,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 _owedFee,
        uint256 _toReturnFee
    )
        external
        validPosition(_productId, _positionId)
        nonReentrant
        returns (uint256)
    {
        /// Check if the caller even owns the position.
        if (
            IPositions(productToPositionContract[_productId]).getOwner(
                _positionId
            ) != _msgSender()
        ) revert ERR_POP_Trading_NotThePositionOwner();

        /// CHECK IF THE SIGNATURE ORIGINATED FROM THE SEQUENCER OR NOT.
        if (
            ecrecover(_sequencerSignature, v, r, s) != sequencerAddress ||
            signatureUsed[_sequencerSignature]
        ) revert ERR_POP_Trading_SequencerSignatureInvalid();

        if (
            paymentToken.allowance(_msgSender(), address(this)) <
            _owedFee + _toReturnFee
        ) revert ERR_POP_Trading_InsufficientApprovedAmount();

        if (
            !paymentToken.transferFrom(
                _msgSender(),
                address(this),
                _owedFee + _toReturnFee
            )
        ) revert ERR_POP_Trading_TokenTransferFailed();

        // Protocol collects [M(q + q′) −M(q)] ∗ fee
        // Pay [M(q + q′) −M(q)] ∗ (1−fee) to user
        if (!paymentToken.transfer(_msgSender(), _toReturnFee))
            revert ERR_POP_Trading_TokenTransferFailed();

        signatureUsed[_sequencerSignature] = true;

        BurnRequest memory associatedRequest = BurnRequest({
            burner: _msgSender(),
            productId: _productId,
            positionId: _positionId,
            toReturnFee: _toReturnFee,
            totalFee: _owedFee,
            isFullFilled: false
        });

        burnRequestIdToStructure[
            nextBurnRequestId.current()
        ] = associatedRequest;

        emit BurnRequested(_msgSender(), nextBurnRequestId.current());
        emit PositionStatus(
            _msgSender(),
            _productId,
            _positionId,
            0,
            nextBurnRequestId.current(),
            3
        );

        nextBurnRequestId.increment();

        return nextBurnRequestId.current() - 1;
    }

    /// @notice The final function called by the sequencer to officially burn the position.
    /// @param _requestId The associated Burn Request.
    /// @param _updatedPositions Array of values that affects the supplyBase of the associatedProduct. Mentioned
    /// in the spec sheet.
    function burnPositionSequencer(
        uint256 _requestId,
        uint256[] memory _updatedPositions
    ) external onlySequencer nonReentrant {
        BurnRequest storage associatedRequest = burnRequestIdToStructure[
            _requestId
        ];
        if (
            associatedRequest.isFullFilled ||
            associatedRequest.burner == address(0) ||
            associatedRequest.totalFee == 0
        ) revert ERR_POP_Trading_UserBurnRequestIsInvalid();

        // Updates for the supply base.
        Product storage associatedProduct = products[
            associatedRequest.productId
        ];
        uint256 limit = associatedProduct.intervals;
        for (uint256 i = 0; i < limit; i++)
            // Set qi = qi −q′i
            associatedProduct.supplyBase[i] = _updatedPositions[i];

        IPositions positionContract = IPositions(
            productToPositionContract[associatedRequest.productId]
        );
        positionContract.burn(associatedRequest.positionId);

        emit PositionStatus(
            associatedRequest.burner,
            associatedRequest.productId,
            associatedRequest.positionId,
            0,
            _requestId,
            4
        );

        associatedRequest.isFullFilled = true;
    }

    /// @notice GETTER FUNCTIONS ==================================================

    /// @notice To get a product details based on its id.
    function getProduct(
        bytes32 _productId
    ) external view returns (Product memory) {
        return products[_productId];
    }

    /// @notice To get a list of products together.
    function getProducts(
        bytes32[] memory _productIds,
        uint256 _limit
    ) external view returns (Product[] memory) {
        Product[] memory toReturn = new Product[](_limit);
        for (uint256 index = 0; index < _limit; index++) {
            toReturn[index] = products[_productIds[index]];
        }

        return toReturn;
    }

    /// @notice Not required as of now. May need for the platform. dk.
    function getSlippageEstimate(
        uint256 _ask,
        uint256 _bid,
        uint256 _quantity
    ) external pure returns (uint256) {
        uint256 spread = _ask - _bid;
        uint256 slippageEstimate = spread * _quantity;
        return slippageEstimate;
    }

    /// @notice Mentioned in the spec. Just an implementation.
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

    /// @dev Should be handled on the front since this will essentially return a fractional value.
    /// @dev Or we can multiply the numerator q(Supply of a token Ti) value with 10**x and divide the return
    /// @dev value with 10**x on the front to get the actual value,
    function getHistogramValue(
        bytes32 _productId
    ) external view returns (uint256) {
        Product memory currentProduct = products[_productId];

        uint256[] memory supplyBase = currentProduct.supplyBase;
        uint256[] memory temp;
        uint256 limit = currentProduct.intervals;

        uint currentM = getM(supplyBase, temp, limit, false);

        uint256 numerator = 10 ** DECIMALS * currentProduct.totalSupply;
        uint256 histogramValue = numerator / currentM;
        return histogramValue;
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

    function setSequencer(address _sequencer) external onlyOwner {
        sequencerAddress = _sequencer;
    }

    function setVaultStaking(address _vaultStaking) external onlyOwner {
        vaultStakingAddress = _vaultStaking;
    }

    function setPaymentToken(address _newToken) external onlyOwner {
        paymentToken = IERC20(_newToken);
    }

    /// @notice ADMIN FUNCTIONS ====================================================
    function bytes32ToString(
        bytes32 _bytes32Data
    ) public pure returns (string memory) {
        bytes memory bytesData = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            bytesData[i] = _bytes32Data[i];
        }
        return string(bytesData);
    }

    /// @notice To add a new product with the provided params.
    /// @dev IMPORTANT : In the product params, for the max/min price, You need to make sure
    /// the difference of max and min is divisible by the intervals provided with no remainder.
    function addProduct(
        bytes32 _productId,
        bytes32 _name,
        bytes32 _symbol,
        Product memory _productParams
    ) external onlyOwner {
        require(products[_productId].intervals == 0, "product-exists");

        uint256 intervals = _productParams.intervals;
        uint256 intervalSupply = _productParams.totalSupply /
            _productParams.intervals;

        if (
            intervalSupply * _productParams.intervals !=
            _productParams.totalSupply
        ) revert ERR_POP_Trading_InvalidIntervalSupplyRatio();

        uint256[] memory supplyBase;
        uint256[] memory multiplicatorBase;

        // supplyBase[intervals - 1] = 0;

        assembly {
            // Calculate the size of the array in bytes
            let size := mul(intervals, 32)
            // Allocate memory for the array
            multiplicatorBase := mload(0x40)
            // Set the length of the array
            mstore(multiplicatorBase, intervals)
            // Initialize all elements to 1
            for {
                let i := 0
            } lt(i, intervals) {
                i := add(i, 1)
            } {
                mstore(add(multiplicatorBase, mul(add(i, 1), 32)), 1)
            }
            // Update the free memory pointer
            mstore(0x40, add(multiplicatorBase, add(size, 32)))
        }

        assembly {
            let size := mul(intervals, 32)
            supplyBase := mload(0x40)
            mstore(supplyBase, intervals)

            for {
                let i := 0
            } lt(i, intervals) {
                i := add(i, 1)
            } {
                mstore(add(supplyBase, mul(add(i, 1), 32)), intervalSupply)
            }

            mstore(0x40, add(supplyBase, add(size, 32)))
        }

        POP_Positions associatedPositionContract = new POP_Positions(
            _productId,
            bytes32ToString(_name),
            bytes32ToString(_symbol),
            intervals
        );

        productToPositionContract[_productId] = address(
            associatedPositionContract
        );

        products[_productId] = Product({
            supplyBase: supplyBase,
            multiplicatorBase: multiplicatorBase,
            minPrice: _productParams.minPrice,
            maxPrice: _productParams.maxPrice,
            intervals: _productParams.intervals,
            totalSupply: _productParams.totalSupply,
            margin: _productParams.margin,
            fee: _productParams.fee,
            positionContract: address(associatedPositionContract)
        });

        emit ProductAdded(_productId, _name, _symbol, products[_productId]);
    }

    /// UPDATE FUNCTIONS =========================================
    /// @dev These should be allowed to be updated but not sure.

    /// @notice To update the supplyBase for a given product.
    function updateSupplyBase(
        bytes32 _productId,
        uint256[] memory _newSupply,
        uint256 _totalSupply
    ) external isOperator validProduct(_productId) {
        Product storage product = products[_productId];

        for (uint i = 0; i < product.intervals; i++) {
            product.supplyBase[i] = _newSupply[i];
        }

        product.totalSupply = _totalSupply;
    }

    function updateMultiplicatorBase(
        bytes32 _productId,
        uint256[] memory _newMultiplicator
    ) external isOperator validProduct(_productId) {
        Product storage product = products[_productId];

        for (uint i = 0; i < product.intervals; i++) {
            product.multiplicatorBase[i] = _newMultiplicator[i];
        }
    }

    /// @notice Can be used to discontinue an asset by setting the limit to 0.
    function updateProduct(
        bytes32 _productId,
        Product memory _newProductParams
    ) external onlyOwner validProduct(_productId) {
        Product storage product = products[_productId];

        product.supplyBase = _newProductParams.supplyBase;
        product.multiplicatorBase = _newProductParams.multiplicatorBase;
        product.minPrice = _newProductParams.minPrice;
        product.maxPrice = _newProductParams.maxPrice;
        product.intervals = _newProductParams.intervals;
        product.totalSupply = _newProductParams.totalSupply;
        product.margin = _newProductParams.margin;
        product.fee = _newProductParams.fee;
        product.positionContract = _newProductParams.positionContract;
    }

    ///  ================================================

    function transferTokensToVault() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(vaultStakingAddress, balance);
    }

    function transferETHToVault() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(vaultStakingAddress).transfer(balance);
    }

    /// ================================================

    fallback() external payable {}

    receive() external payable {}
}
