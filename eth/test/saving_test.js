const Saving = artifacts.require("Saving");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Saving", function (/* accounts */) {
  it("should assert true", async function () {
    await Saving.deployed();
    return assert.isTrue(true);
  });
});
