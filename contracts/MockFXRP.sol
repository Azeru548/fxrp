// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockFXRP
 * @notice Minimal test ERC-20 standing in for FXRP (the FAsset-wrapped XRP)
 *         on test networks. 18 decimals, anyone can mint for testing.
 *         Swap for the real FXRP contract address when deploying on
 *         Songbird / Flare Mainnet.
 */
contract MockFXRP {
    string public constant name = "Test FXRP";
    string public constant symbol = "T-FXRP";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function mint(address _to, uint256 _amount) external {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }

    function approve(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transfer(address _to, uint256 _amount) external returns (bool) {
        return _transfer(msg.sender, _to, _amount);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool) {
        uint256 allowed = allowance[_from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= _amount, "allowance exceeded");
            allowance[_from][msg.sender] = allowed - _amount;
        }
        return _transfer(_from, _to, _amount);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (bool) {
        require(balanceOf[_from] >= _amount, "insufficient balance");
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(_from, _to, _amount);
        return true;
    }
}
