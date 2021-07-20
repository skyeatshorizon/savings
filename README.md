# savings
For users who want to store their Crypto for a looooooooong time

## ETH
### Support
* ETH
* ERC-20
* ERC-777
	
### Usage
#### Storage
Simply send Tokens/ETH to the Contract Address
#### Payut ETH
Simply send any amount of ETH to the Contract and it will payout to `owner` after `block.number > lockedUntil`
#### Payout Token
call `withdrawalERC20(address _erc20Addr)` and it will payout to `owner` after `block.number > lockedUntil`
#### Rescue ETH/TOKEN
However, it is possible to access funds before `lockTime` if more than half of the Quorum members send exactly `505 wei` to this contract.
Funds will automatically be moved to `owner`. However, tokens need to be moved with `withdrawalERC20(address _erc20Addr)`.
#### Further Functionallity
[Ownership and Access Control](https://docs.openzeppelin.com/contracts/2.x/api/ownership)
