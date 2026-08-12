// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FxrpPay
 * @notice Pay with XRP, settle on Flare.
 *
 * Merchants create invoice "payment links" priced either in a fixed amount of
 * FXRP (the FAsset-wrapped XRP) or in USD cents that are converted on-chain to
 * FXRP using the Flare FTSOv2 XRP/USD price feed at payment time.
 *
 * No external imports - compiles directly in Remix.
 */
contract FxrpPay {
    uint8 public constant PRICING_FIXED = 0; // fixed amount in payment token
    uint8 public constant PRICING_USD = 1;   // USD cents, converted via FTSOv2

    // FTSOv2 feed id for XRP/USD (bytes21, wei-based values)
    bytes21 public constant XRP_USD_FEED =
        0x015852502f55534400000000000000000000000000;

    struct Invoice {
        address payee; // merchant who receives funds
        address token; // payment token (FXRP, 18 decimals)
        uint8 pricing; // PRICING_FIXED or PRICING_USD
        uint256 amount; // PRICING_FIXED: token units | PRICING_USD: USD cents
        uint256 paid; // tokens collected so far
        bool open; // still accepting payments
        string memo;
    }

    Invoice[] public invoices;

    /// FTSOv2 oracle address (constructor arg). address(0) disables USD pricing.
    address public ftsoV2;

    bool private _locked;

    event InvoiceCreated(
        uint256 indexed id,
        address indexed payee,
        address token,
        uint8 pricing,
        uint256 amount,
        string memo
    );
    event PaymentReceived(
        uint256 indexed id,
        address indexed payer,
        uint256 amount,
        uint256 totalPaid
    );
    event Withdrawn(uint256 indexed id, address indexed payee, uint256 amount);
    event InvoiceClosed(uint256 indexed id);
    event InvoiceCancelled(uint256 indexed id);

    constructor(address _ftsoV2) {
        ftsoV2 = _ftsoV2;
    }

    modifier nonReentrant() {
        require(!_locked, "reentrant");
        _locked = true;
        _;
        _locked = false;
    }

    // ------------------------------------------------------------------ //
    //  Merchant: create invoice
    // ------------------------------------------------------------------ //

    function createInvoice(
        address _payee,
        address _token,
        uint8 _pricing,
        uint256 _amount,
        string calldata _memo
    ) external returns (uint256 id) {
        require(_payee != address(0), "zero payee");
        require(_token != address(0), "zero token");
        require(_amount > 0, "zero amount");
        require(
            _pricing == PRICING_FIXED || _pricing == PRICING_USD,
            "bad pricing"
        );
        if (_pricing == PRICING_USD) {
            require(ftsoV2 != address(0), "oracle not set");
        }
        id = invoices.length;
        invoices.push(
            Invoice({
                payee: _payee,
                token: _token,
                pricing: _pricing,
                amount: _amount,
                paid: 0,
                open: true,
                memo: _memo
            })
        );
        emit InvoiceCreated(id, _payee, _token, _pricing, _amount, _memo);
    }

    // ------------------------------------------------------------------ //
    //  Payer: pay an invoice
    // ------------------------------------------------------------------ //

    /**
     * @dev Pulls exactly the remaining due amount via ERC20 transferFrom.
     *      For USD-priced invoices, sends the FTSOv2 fee in FLR (msg.value)
     *      and refunds any excess. Approve the token before calling.
     */
    function pay(uint256 _id) external payable nonReentrant {
        Invoice storage inv = _get(_id);
        require(inv.open, "invoice closed");

        uint256 target;
        if (inv.pricing == PRICING_USD) {
            target = _priceToTokens(inv.amount, msg.value); // pays fee, refunds excess
        } else {
            require(msg.value == 0, "no value needed");
            target = inv.amount;
        }
        uint256 due = target - inv.paid;
        require(due > 0, "already paid");

        require(
            IERC20(inv.token).transferFrom(msg.sender, address(this), due),
            "token transfer failed"
        );

        inv.paid += due;
        if (inv.paid >= target) {
            inv.open = false;
            emit InvoiceClosed(_id);
        }
        emit PaymentReceived(_id, msg.sender, due, inv.paid);
    }

    // ------------------------------------------------------------------ //
    //  Merchant: withdraw / cancel
    // ------------------------------------------------------------------ //

    function withdraw(uint256 _id) external nonReentrant {
        Invoice storage inv = _get(_id);
        require(msg.sender == inv.payee, "only payee");
        uint256 amount = inv.paid;
        require(amount > 0, "nothing to withdraw");
        inv.paid = 0;
        require(IERC20(inv.token).transfer(msg.sender, amount), "withdraw failed");
        emit Withdrawn(_id, msg.sender, amount);
    }

    function cancelInvoice(uint256 _id) external {
        Invoice storage inv = _get(_id);
        require(msg.sender == inv.payee, "only payee");
        require(inv.open, "already closed");
        inv.open = false;
        emit InvoiceCancelled(_id);
    }

    // ------------------------------------------------------------------ //
    //  Views
    // ------------------------------------------------------------------ //

    function getDue(uint256 _id) external view returns (uint256 due) {
        Invoice storage inv = _get(_id);
        if (!inv.open) return 0;
        return _target(inv) - inv.paid;
    }

    function isPaid(uint256 _id) external view returns (bool) {
        Invoice storage inv = _get(_id);
        return !inv.open && inv.paid >= _target(inv);
    }

    /// Returns the XRP/USD price in wei (18 decimals) from FTSOv2.
    function getXrpUsdPriceWei() external view returns (uint256, uint64) {
        require(ftsoV2 != address(0), "oracle not set");
        (uint256 value, uint64 ts) = IFtsoV2View(ftsoV2).getFeedByIdInWei(
            XRP_USD_FEED
        );
        return (value, ts);
    }

    /// FTSOv2 fee for the XRP/USD feed, in FLR wei. What to send as msg.value.
    function oracleFee() external view returns (uint256) {
        require(ftsoV2 != address(0), "oracle not set");
        return IFtsoV2(ftsoV2).calculateFeeById(XRP_USD_FEED);
    }

    // ------------------------------------------------------------------ //
    //  Internal
    // ------------------------------------------------------------------ //

    function _target(Invoice storage inv) internal view returns (uint256) {
        if (inv.pricing == PRICING_FIXED) return inv.amount;
        (uint256 price, ) = IFtsoV2View(ftsoV2).getFeedByIdInWei(XRP_USD_FEED);
        require(price > 0, "bad price");
        return _usdCentsToTokens(inv.amount, price);
    }

    /**
     * @dev Fetches the XRP/USD price paying the FTSOv2 fee out of msg.value.
     *      Refunds any excess FLR to the caller. Returns the token target.
     */
    function _priceToTokens(
        uint256 _usdCents,
        uint256 _msgValue
    ) internal returns (uint256) {
        uint256 fee = IFtsoV2(ftsoV2).calculateFeeById(XRP_USD_FEED);
        require(_msgValue >= fee, "oracle fee required");
        (uint256 price, ) = IFtsoV2(ftsoV2).getFeedByIdInWei{
            value: fee
        }(XRP_USD_FEED);
        require(price > 0, "bad price");
        if (_msgValue > fee) {
            (bool ok, ) = msg.sender.call{value: _msgValue - fee}("");
            require(ok, "refund failed");
        }
        return _usdCentsToTokens(_usdCents, price);
    }

    /// @dev USD cents -> token units (18 decimals), ceiling-rounded.
    function _usdCentsToTokens(
        uint256 _usdCents,
        uint256 _xrpUsdWei
    ) internal pure returns (uint256) {
        uint256 usdWei = _usdCents * 1e16; // cents -> wei USD (18 decimals)
        return (usdWei * 1e18 + _xrpUsdWei - 1) / _xrpUsdWei;
    }

    function _get(uint256 _id) internal view returns (Invoice storage) {
        require(_id < invoices.length, "no such invoice");
        return invoices[_id];
    }
}

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

interface IFtsoV2 {
    function getFeedByIdInWei(
        bytes21 _feedId
    ) external payable returns (uint256 _value, uint64 _timestamp);

    function calculateFeeById(bytes21 _feedId) external view returns (uint256);
}

/// View-only typing of the same selector, for eth_call reads.
interface IFtsoV2View {
    function getFeedByIdInWei(
        bytes21 _feedId
    ) external view returns (uint256 _value, uint64 _timestamp);
}
