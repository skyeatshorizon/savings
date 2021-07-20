const { expectEvent, singletons, constants } = require("openzeppelin-test-helpers");

const Saving = artifacts.require("Saving");
const Token = artifacts.require("Token");
const BN = web3.utils.BN;
const tokenCnt = new BN("100000000000000000000");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Saving", function ([creator, beneficiary, acc0, acc1, acc2, anybody]) {
	beforeEach(async function () {
		this.token = await Token.new(tokenCnt, "DummyToken", "XDT", {from: creator});
		this.erc1820 = await singletons.ERC1820Registry(creator);
	});

	it("should create with correct parameters", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("5"));
		const saving = await Saving.new(lockedUntil, {from: creator});
		await saving.transferOwnership(beneficiary);

		const lockedUntilAfter = new BN(await saving.lockedUntil());
		assert.equal(lockedUntilAfter.toString(), lockedUntil.toString());
		assert(await saving.hasRole("0x0", creator));
	});

	it("should accept ETH multiple times", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("999999999"));
		const saving = await Saving.new(block.add(lockedUntil));
		await saving.transferOwnership(beneficiary);

		const balanceSavingPre = new BN(await web3.eth.getBalance(saving.address));
		let sendTotal = new BN("0");
		for (var i =  0; i < 10; ++i) {
			const ethSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethSend});
			sendTotal = sendTotal.add(ethSend);
		}

		const balanceSavingPost = new BN(await web3.eth.getBalance(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());
	});

	it("should forward all ETH to beneficiary after block X", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedFor = new BN("5");
		const lockedUntil = block.add(lockedFor);
		const saving = await Saving.new(lockedUntil);
		await saving.transferOwnership(beneficiary);

		const balanceSavingPre = new BN(await web3.eth.getBalance(saving.address));

		let sendTotal = new BN("0");
		for (var i =  new BN("0"); i.lt(lockedFor.sub(new BN("2"))); i = i.add(new BN("1"))) {
			const ethSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethSend});
			sendTotal = sendTotal.add(ethSend);
		}

		const balanceSavingPost = new BN(await web3.eth.getBalance(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());
		//console.log(balanceSavingPost.toString())

		const ethAfterX = new BN("1");
		const balanceBeneficiary0 = new BN(await web3.eth.getBalance(beneficiary));
		//console.log("balanceBeneficiary0 ", balanceBeneficiary0.toString())
		tx = await web3.eth.sendTransaction({from: beneficiary, to: saving.address, value: ethAfterX});
		fee = (new BN(tx.cumulativeGasUsed).mul(new BN(await web3.eth.getGasPrice())));
		const balanceBeneficiary1 = new BN(await web3.eth.getBalance(beneficiary));
		//console.log("balanceBeneficiary1 ", balanceBeneficiary1.toString())
		//console.log("Diff: ", balanceBeneficiary1.sub(balanceBeneficiary0).toString())
		//console.log(new BN(await web3.eth.getBalance(saving.address)).toString())
		
		assert.equal(
			balanceBeneficiary1.toString(),
			balanceBeneficiary0.add(sendTotal).sub(fee).toString()
		);

		const balanceBeneficiary2 = new BN(await web3.eth.getBalance(beneficiary));
		tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: ethAfterX});
		fee = (new BN(tx.cumulativeGasUsed).mul(new BN(await web3.eth.getGasPrice())));
		const balanceBeneficiary3 = new BN(await web3.eth.getBalance(beneficiary));
		assert.equal(balanceBeneficiary3.toString(), balanceBeneficiary0.add(sendTotal).add(ethAfterX).sub(fee).toString());
	});

	it("should accept ERC20 tokens multiple times", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("999999999"));
		const saving = await Saving.new(block.add(lockedUntil));
		await saving.transferOwnership(beneficiary);


		const balanceSavingPre = new BN(await this.token.balanceOf(saving.address));
		let sendTotal = new BN("0");
		for (var i =  0; i < 10; ++i) {
			const tokenSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await this.token.transfer(saving.address, tokenSend);
			sendTotal = sendTotal.add(tokenSend);
		}

		const balanceSavingPost = new BN(await this.token.balanceOf(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());
	});

	it("should withdrawal all token to beneficiary after block X", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedFor = new BN("3");
		const lockedUntil = block.add(lockedFor);
		const saving = await Saving.new(lockedUntil);
		await saving.transferOwnership(beneficiary);

		const balanceSavingPre = new BN(await this.token.balanceOf(saving.address));

		let sendTotal = new BN("0");
		for (var i =  new BN("0"); i.lt(lockedFor.sub(new BN("2"))); i = i.add(new BN("1"))) {
			const tokenSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await this.token.transfer(saving.address, tokenSend);
			sendTotal = sendTotal.add(tokenSend);
		}

		const balanceSavingPost = new BN(await this.token.balanceOf(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());

		const balanceBeneficiary0 = new BN(await this.token.balanceOf(beneficiary));
		await saving.withdrawalERC20(this.token.address);
		const balanceBeneficiary1 = new BN(await this.token.balanceOf(beneficiary));

		assert.equal(
			balanceBeneficiary1.toString(),
			balanceBeneficiary0.add(sendTotal).toString()
		);
	});

	it("should release all token to beneficiary after rescue", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("999999999"));
		const saving = await Saving.new(block.add(lockedUntil));
		await saving.transferOwnership(beneficiary);


		const balanceSavingPre = new BN(await this.token.balanceOf(saving.address));
		let sendTotal = new BN("0");
		for (var i =  0; i < 10; ++i) {
			const tokenSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await this.token.transfer(saving.address, tokenSend);
			sendTotal = sendTotal.add(tokenSend);
		}

		const balanceSavingPost = new BN(await this.token.balanceOf(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());

		await saving.grantRole("0x0", acc0, {from: creator});
		await saving.grantRole("0x0", acc1, {from: creator});
		await saving.grantRole("0x0", acc2, {from: creator});

		const sos = new BN("505");
		await web3.eth.sendTransaction({from: acc0, to: saving.address, value: sos});
		await web3.eth.sendTransaction({from: acc1, to: saving.address, value: sos});
		await web3.eth.sendTransaction({from: acc2, to: saving.address, value: sos});

		const balanceBeneficiary0 = new BN(await this.token.balanceOf(beneficiary));
		tx = await saving.withdrawalERC20(this.token.address);
		const balanceBeneficiary1 = new BN(await this.token.balanceOf(beneficiary));

		assert.equal(balanceBeneficiary0.add(sendTotal).toString(), balanceBeneficiary1.toString());
	});

	it("should release all ETH to beneficiary after rescue", async function () {
		const block = new BN(await web3.eth.getBlockNumber());
		const lockedUntil = block.add(new BN("999999999"));
		const saving = await Saving.new(block.add(lockedUntil));
		await saving.transferOwnership(beneficiary);


		const balanceSavingPre = new BN(await web3.eth.getBalance(saving.address));
		let sendTotal = new BN("0");
		for (var i =  0; i < 10; ++i) {
			const tokenSend = new BN(Math.floor(Math.random() * 1000000000000) + 1);

			const tx = await web3.eth.sendTransaction({from: acc0, to: saving.address, value: tokenSend});
			sendTotal = sendTotal.add(tokenSend);
		}

		const balanceSavingPost = new BN(await web3.eth.getBalance(saving.address));
		assert.equal(balanceSavingPre.add(sendTotal).toString(), balanceSavingPost.toString());

		await saving.grantRole("0x0", acc0, {from: creator});
		await saving.grantRole("0x0", acc1, {from: creator});
		await saving.grantRole("0x0", acc2, {from: creator});

		const balanceBeneficiary0 = new BN(await web3.eth.getBalance(beneficiary));

		const sos = new BN("505");
		await web3.eth.sendTransaction({from: acc0, to: saving.address, value: sos});
		await web3.eth.sendTransaction({from: acc1, to: saving.address, value: sos});
		await web3.eth.sendTransaction({from: acc2, to: saving.address, value: sos});
		sendTotal = sendTotal.add(sos.mul(new BN("3")));

		const balanceBeneficiary1 = new BN(await web3.eth.getBalance(beneficiary));

		assert.equal(balanceBeneficiary0.add(sendTotal).toString(), balanceBeneficiary1.toString());
	});
});