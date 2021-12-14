# @givety/lib-ethers

[Ethers](https://www.npmjs.com/package/ethers)-based library for reading Givety protocol state and sending transactions.

## Quickstart

Install in your project:

```
npm install --save givety-lib-base @givety/lib-ethers ethers@^5.0.0
```

Connecting to an Ethereum node and sending a transaction:

```javascript
const { Wallet, providers } = require("ethers");
const { EthersGivety } = require("@givety/lib-ethers");

async function example() {
  const provider = new providers.JsonRpcProvider("http://localhost:8545");
  const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
  const givety = await EthersGivety.connect(wallet);

  const { newTrove } = await givety.openTrove({
    depositCollateral: 5, // GIVE
    borrowGUSD: 2000
  });

  console.log(`Successfully opened a Givety Trove (${newTrove})!`);
}
```

## More examples

See [packages/examples](https://github.com/givety/givety/tree/master/packages/examples) in the repo.

Givety's [Dev UI](https://github.com/givety/givety/tree/master/packages/dev-frontend) itself contains many examples of `@givety/lib-ethers` use.

## API Reference

For now, it can be found in the public Givety [repo](https://github.com/givety/givety/blob/master/docs/sdk/lib-ethers.md).

