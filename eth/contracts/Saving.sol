// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";

contract Saving is AccessControl, Ownable, IERC777Recipient {
	bytes32 constant private _TOKENS_RECIPIENT_INTERFACE_HASH = 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b;
    IERC1820Registry constant internal _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
	uint256 public immutable lockedUntil;
	mapping(address => bool) private used;
	Counters.Counter private rescueCnt;

	constructor(uint256 _lockedUntil) {
		_ERC1820_REGISTRY.setInterfaceImplementer(address(0), _TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
		lockedUntil = _lockedUntil;

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
	}

	receive() external payable {
		uint minConfirmations = SafeMath.div(getRoleMemberCount(DEFAULT_ADMIN_ROLE), 2);

		if(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && (msg.value == 505 wei)){ //SOS
			require(!used[msg.sender], "Saving: cannot 505 twice");
			used[msg.sender] = true;
			Counters.increment(rescueCnt);
		}

		if((block.number > lockedUntil) || (Counters.current(rescueCnt) > minConfirmations)){
			payable(owner()).transfer(address(this).balance);
		}
	}

	function withdrawalERC20(address _erc20Addr) external {
		uint minConfirmations = SafeMath.div(getRoleMemberCount(DEFAULT_ADMIN_ROLE), 2);
		require((block.number > lockedUntil) || (Counters.current(rescueCnt) > minConfirmations), "Saving: cannot free funds yet");
		IERC20 token = IERC20(_erc20Addr);
		uint256 balance = token.balanceOf(address(this));
		token.transfer(owner(), balance);
	}

	function tokensReceived(
        address /*operator*/,
        address /*from*/,
        address /*to*/,
        uint256 /*amount*/,
        bytes calldata /*userData*/,
        bytes calldata /*operatorData*/
    ) external override {

    }
}
