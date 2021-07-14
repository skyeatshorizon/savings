// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Saving is AccessControl {
	address public immutable beneficiary;
	uint256 public immutable lockedUntil;
	mapping(address => bool) used;
	Counters.Counter rescueCnt;

	constructor(address _beneficiary, uint256 _lockedUntil) {
		beneficiary = _beneficiary;
		lockedUntil = _lockedUntil;
	}

	receive() external payable{
		if(block.number >= lockedUntil){
			payable(beneficiary).transfer(address(this).balance);
		}

		if(hasRole(DEFAULT_ADMIN_ROLE, msg.sender)){
			if(msg.value == 505 wei) { //SOS
				require(!used[msg.sender]);

				uint minConfirmations = SafeMath.div(getRoleMemberCount(DEFAULT_ADMIN_ROLE), 2);
				if(Counters.current(rescueCnt) > minConfirmations){
					payable(beneficiary).transfer(address(this).balance);
				}

				used[msg.sender] = true;
				Counters.increment(rescueCnt);
			}
		}
	}

	function withdrawalERC20(address _erc20Addr) external {
		uint minConfirmations = SafeMath.div(getRoleMemberCount(DEFAULT_ADMIN_ROLE), 2);
		require((block.number >= lockedUntil) || (Counters.current(rescueCnt) > minConfirmations));
		IERC20 token = IERC20(_erc20Addr);
		uint256 balance = token.balanceOf(address(this));
		token.transfer(beneficiary, balance);
	}
}
