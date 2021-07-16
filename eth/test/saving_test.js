const Saving = artifacts.require("Saving");
const ERC20 = artifacts.require("ERC20");
const BN = web3.utils.BN;

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Saving", function ([creator, beneficiary, acc0, acc1, acc2, anybody]) {
	beforeEach(async function () {
		this.erc20 = await ERC20.new("DummyToken", "XDT");
	});

	it("should create with correct parameters", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("5"));
		const saving = await Saving.new(beneficiary, lockedUntil);
		//await Saving.deployed();
		const beneficiaryAfter = await saving.beneficiary();
		assert.equal(beneficiaryAfter, beneficiary);
		const lockedUntilAfter = new BN(await saving.lockedUntil());
		assert.equal(lockedUntilAfter.toString(), lockedUntil.toString());
	});

	it("should accept ETH multiple times", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("999999999"));
		const saving = await Saving.new(beneficiary, block.add(lockedUntil));
		const balancePre = new BN(await web3.eth.getBalance(saving.address));
		let countBalance = new BN("0");
		for (var i =  0; i < 10; ++i) {
			const ethSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethSend});
			countBalance = countBalance.add(ethSend);
		}

		const balancePost = new BN(await web3.eth.getBalance(saving.address));
		assert.equal(countBalance.toString(), balancePre.add(balancePost).toString());
	});

	it("should forward all ETH to beneficiary after block X", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("1"));
		const saving = await Saving.new(beneficiary, block.add(lockedUntil));
		const balancePre = new BN(await web3.eth.getBalance(saving.address));
		let countBalance = new BN("0");
		for (var i =  0; i < 1; ++i) {
			const ethSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethSend});
			countBalance = countBalance.add(ethSend);
		}

		const balancePost = new BN(await web3.eth.getBalance(saving.address));
		assert.equal(countBalance.toString(), balancePre.add(balancePost).toString());

		const balanceBeneficiary0 = new BN(await web3.eth.getBalance(beneficiary));
		console.log("balance ben 0", balanceBeneficiary0.toString())
		const ethAfterX = new BN("1");
		tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethAfterX});
		console.log(tx)
		const balanceBeneficiary1 = new BN(await web3.eth.getBalance(beneficiary));
		console.log(balanceBeneficiary1.toString())
		assert.equal(balanceBeneficiary1.toString(), balanceBeneficiary0.add(countBalance).add(ethAfterX).toString());

		const balanceBeneficiary2 = new BN(await web3.eth.getBalance(beneficiary));
		await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethAfterX});
		const balanceBeneficiary3 = new BN(await web3.eth.getBalance(beneficiary));
		assert.equal(balanceBeneficiary3.toString(), balanceBeneficiary0.add(countBalance).add(ethAfterX).toString());
	});
});
