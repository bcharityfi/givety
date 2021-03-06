<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [PopulatedEthersGivetyTransaction](./lib-ethers.populatedethersgivetytransaction.md)

## PopulatedEthersGivetyTransaction class

A transaction that has been prepared for sending.

<b>Signature:</b>

```typescript
export declare class PopulatedEthersGivetyTransaction<T = unknown> implements PopulatedGivetyTransaction<EthersPopulatedTransaction, SentEthersGivetyTransaction<T>> 
```
<b>Implements:</b> [PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;[EthersPopulatedTransaction](./lib-ethers.etherspopulatedtransaction.md)<!-- -->, [SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;T&gt;&gt;

## Remarks

Returned by [PopulatableEthersGivety](./lib-ethers.populatableethersgivety.md) functions.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PopulatedEthersGivetyTransaction` class.

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [gasHeadroom?](./lib-ethers.populatedethersgivetytransaction.gasheadroom.md) |  | number | <i>(Optional)</i> Extra gas added to the transaction's <code>gasLimit</code> on top of the estimated minimum requirement. |
|  [rawPopulatedTransaction](./lib-ethers.populatedethersgivetytransaction.rawpopulatedtransaction.md) |  | [EthersPopulatedTransaction](./lib-ethers.etherspopulatedtransaction.md) | Unsigned transaction object populated by Ethers. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [send()](./lib-ethers.populatedethersgivetytransaction.send.md) |  | Send the transaction. |

