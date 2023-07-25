//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;

import "./Positions.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IERC20.sol";

/// @notice All the relevant error codes.
error ERR_POP_Trading_InsufficientApprovedAmount();
error ERR_POP_Trading_IsSequencerFunction();
error ERR_POP_Trading_SequencerSignatureInvalid();
error ERR_POP_Trading_InvalidProductId();
error ERR_POP_Trading_TokenTransferFailed();
error ERR_POP_Trading_UserMintRequestIsInvalid();
error ERR_POP_Trading_UserBurnRequestIsInvalid();
error ERR_POP_Trading_NotThePositionOwner();

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
    uint256 toReturnFee;
    uint256 totalFee;
    bool isFullFilled;
}

/// @dev Product - Underlying asset or financial instrument that the options contract is based on.
/// Created by the exchange. BPS:"basis points".
/// @param supplyBase The variable q mentioned in the specifications which represent the count of tokens over all the intervals n.
/// @param multiplicatorBase Created to help in the maths involved that affects the tokens at each position based on certain rules.
/// @param limit The current upper bound of valid values in the supplyBase and multiplicatorBase ie the limit of say Qn.
/// @param supply Total supply of the given product. Sum of Q1, Q2 .... Qn
/// @param margin Collateral that a trader must deposit with their broker or exchange in order to open and maintain a leveraged trading position.
/// @param fee Platform fee.
struct Product {
    uint256[] supplyBase;
    uint256[] multiplicatorBase;
    uint256 limit;
    uint256 supply;
    uint256 margin;
    uint256 fee; // In sbps (10^6). 0.5% = 5000. 0.025% = 250
    address positionContract;
}

contract POP_Trading is Ownable {
    /// VARIABLES ==========================================================

    // using ECDSA for bytes32;
    using Address for address payable;
    using Counters for Counters.Counter;

    /// @notice To the get the next mint/burn request id which hasn't been used before.
    /// @notice Each unique id is attached with a MintRequest/BurnRequest struct.
    Counters.Counter public nextMintRequestId;
    Counters.Counter public nextBurnRequestId;

    uint256 public constant DECIMALS = 18;

    /// @notice All the associated contracts the Trading contract interacts with in some form.
    address public sequencerAddress;
    address public stakingAddress;
    address public vaultAddress;
    /// @notice USDC preferrably.
    IERC20 public paymentToken;

    /// @notice Product Id -> Unique Product. Product being the asset being sold on the platform.
    mapping(bytes32 => Product) public products;
    /// @notice Product Id -> Position Contract Address. Each new product when created also deploys an ERC721 too.
    /// @notice Having a single contract for every position would create chaos since its will be harder to manage down the line
    /// @notice and really hard to scale.
    mapping(bytes32 => address) public productToPositionContract;

    /// @notice To track incoming mint/burn requests. Initiated by the user. Uses the nextMintRequestId/nextBurnRequestId
    /// @notice to map each new id with a respective struct.
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

    event ProductAdded(
        bytes32 indexed id,
        string indexed name,
        string indexed symbol,
        Product product
    );

    /// MODIFIERS ===========================================================

    /// @dev Functions only to be called by the sequencerAddress.
    modifier onlySequencer() {
        if (_msgSender() != sequencerAddress)
            revert ERR_POP_Trading_IsSequencerFunction();
        _;
    }

    /// @dev Check if the provided productId is valid or not.
    modifier validProduct(bytes32 _productId) {
        if (products[_productId].limit == 0)
            revert ERR_POP_Trading_InvalidProductId();
        _;
    }

    /// @dev Check if the given position even exists for a given prodcut.
    modifier validPosition(bytes32 _productId, uint256 _positionId) {
        if (products[_productId].limit == 0)
            revert ERR_POP_Trading_InvalidProductId();

        IPositions positionContract = IPositions(
            productToPositionContract[_productId]
        );
        uint256 currentUpper = positionContract.getNextId();
        if (currentUpper <= _positionId)
            revert ERR_POP_Positions_PositionIdOutOfBounds();
        _;
    }

    /// CONTRACT STARTS =====================================================
    constructor(
        address _paymentToken,
        address _sequencer,
        address _staking,
        address _vault
    ) {
        paymentToken = IERC20(_paymentToken);
        sequencerAddress = _sequencer;
        stakingAddress = _staking;
        vaultAddress = _vault;

        nextMintRequestId.increment();
        nextBurnRequestId.increment();
    }

    /// @notice FUNCTIONS =================================================

    /// @dev These should be allowed to be updated but not sure.
    function updateSupplyBase() internal {}

    function updateMultiplicatorBase() internal {}

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
    ) external validProduct(_productId) {
        uint256 fee = products[_productId].fee;

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
        success = paymentToken.transfer(vaultAddress, vaultCut);
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

        nextMintRequestId.increment();
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
    ) external onlySequencer returns (uint256) {
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

        uint256[] memory _multiplicator = products[associatedRequest.productId]
            .multiplicatorBase;

        uint256 positionId = positionContract.mint(
            _positions,
            _multiplicator,
            associatedRequest.receiver,
            associatedRequest.size,
            associatedRequest.strikeUpper,
            associatedRequest.strikeLower
        );

        /// The position id is updated now and is linked with the request.
        associatedRequest.positionId = positionId;
        associatedRequest.isFullFilled = true;

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
    ) external validPosition(_productId, _positionId) {
        IPositions positionContract = IPositions(
            productToPositionContract[_productId]
        );

        /// Check if the caller even owns the position.
        if (positionContract.getOwner(_positionId) != _msgSender())
            revert ERR_POP_Trading_NotThePositionOwner();

        /// CHECK IF THE SIGNATURE ORIGINATED FROM THE SEQUENCER OR NOT.
        if (
            ecrecover(_sequencerSignature, v, r, s) != sequencerAddress ||
            signatureUsed[_sequencerSignature]
        ) revert ERR_POP_Trading_SequencerSignatureInvalid();

        if (paymentToken.allowance(_msgSender(), address(this)) < _owedFee)
            revert ERR_POP_Trading_InsufficientApprovedAmount();
        // Protocol collects [M(q + q′) −M(q)] ∗ fee
        if (!paymentToken.transferFrom(_msgSender(), address(this), _owedFee))
            revert ERR_POP_Trading_TokenTransferFailed();
        // Pay [M(q + q′) −M(q)] ∗ (1−fee) to user
        if (!paymentToken.transfer(_msgSender(), _toReturnFee))
            revert ERR_POP_Trading_TokenTransferFailed();

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

        nextBurnRequestId.increment();
    }

    /// @notice The final function called by the sequencer to officially burn the position.
    /// @param _requestId The associated Burn Request.
    /// @param _updatedPositions Array of values that affects the supplyBase of the associatedProduct. Mentioned
    /// in the spec sheet.
    function burnPositionSequencer(
        uint256 _requestId,
        uint256[] memory _updatedPositions
    ) external onlySequencer {
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
        uint256 limit = associatedProduct.limit;
        for (uint256 i = 0; i < limit; i++)
            // Set qi = qi −q′i
            associatedProduct.supplyBase[i] = _updatedPositions[i];

        IPositions positionContract = IPositions(
            productToPositionContract[associatedRequest.productId]
        );
        positionContract.burn(associatedRequest.positionId);

        associatedRequest.isFullFilled = true;
    }

    /// @notice GETTER FUNCTIONS ==================================================

    /// @notice To get a product details based on its id.
    function getProduct(
        bytes32 _productId
    ) public view returns (Product memory) {
        return products[_productId];
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
        uint256 limit = currentProduct.limit;

        uint currentM = getM(supplyBase, temp, limit, false);

        uint256 numerator = 10 ** DECIMALS * currentProduct.supply;
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

    /// @notice ADMIN FUNCTIONS ====================================================

    function addProduct(
        bytes32 _productId,
        string memory _name,
        string memory _symbol,
        Product memory _productParams
    ) external onlyOwner {
        Product storage product = products[_productId];

        require(product.limit == 0, "product-exists");

        uint256 _limit = _productParams.limit;
        uint256[] memory multiplicatorBase = new uint256[](_limit);
        uint256[] memory supplyBase = new uint256[](_limit);

        for (uint i = 0; i < _limit; i++) {
            supplyBase[i] = 0;
            multiplicatorBase[i] = 1;
        }

        POP_Positions associatedPositionContract = new POP_Positions(
            _productId,
            _name,
            _symbol
        );

        productToPositionContract[_productId] = address(
            associatedPositionContract
        );

        products[_productId] = Product({
            supplyBase: supplyBase,
            multiplicatorBase: multiplicatorBase,
            limit: _productParams.limit,
            supply: _productParams.supply,
            margin: _productParams.margin,
            fee: _productParams.fee,
            positionContract: address(associatedPositionContract)
        });

        emit ProductAdded(_productId, _name, _symbol, products[_productId]);
    }

    /// @notice Can be used to discontinue an asset by setting the limit to 0.
    function updateProduct(
        bytes32 _productId,
        Product memory _newProductParams
    ) external onlyOwner {
        Product storage product = products[_productId];
        require(product.limit > 0, "Product-does-not-exist");

        product.supply = _newProductParams.supply;
        product.margin = _newProductParams.margin;
        product.fee = _newProductParams.fee;
        product.positionContract = _newProductParams.positionContract;
    }

    ///  ================================================

    function transferTokensToVault() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(vaultAddress, balance);
    }

    // function transferETHToVault() external onlyOwner {
    //     uint256 balance = address(this).balance;
    // }

    /// ================================================

    fallback() external payable {}

    receive() external payable {}
}
