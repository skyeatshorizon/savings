// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Saving is AccessControl, Ownable {
	uint256 public immutable lockedUntil;
	mapping(address => bool) private used;
	Counters.Counter private rescueCnt;

	constructor(uint256 _lockedUntil) {
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
}
