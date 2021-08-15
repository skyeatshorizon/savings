// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	constructor(uint256 _amount, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
		_mint(msg.sender, _amount);
	}
}