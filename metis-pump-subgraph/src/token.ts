import {
    Transfer as TransferEvent
  } from "../generated/Token/Token"
  import {
    Token,
    UserMeMeTokenBalance,
    UserMeMeTokenTransaction,
  } from "../generated/schema"
  
  import { BigInt, Bytes } from "@graphprotocol/graph-ts";
  
  export function handleERC20Transfer(event: TransferEvent): void {
    let fromBalanceEntity = UserMeMeTokenBalance.load(event.address.toHexString()+ "_" + event.params.from.toHexString())

    if(fromBalanceEntity == null){
        //must have from
        return;
    }

    // id: ID!
    // from: String!
    // to: String!
    // token: String!
    // tokenAmount: BigInt!

    // blockNumber: BigInt!
    // createTimestamp: BigInt!
    // transactionHash: Bytes!
    let transaction = new UserMeMeTokenTransaction(event.transaction.hash.toHexString())
    transaction.from = event.params.from.toHexString()
    transaction.to = event.params.to.toHexString()
    transaction.token = event.address.toHexString()
    transaction.tokenAmount = event.params.value
    transaction.createTimestamp = event.block.timestamp
    transaction.blockNumber = event.block.number
    transaction.transactionHash = event.transaction.hash

    transaction.save()

    fromBalanceEntity.updateTimestamp = event.block.timestamp
    fromBalanceEntity.tokenAmount = fromBalanceEntity.tokenAmount.minus(event.params.value)
    fromBalanceEntity.save()

    let toBalanceEntity = UserMeMeTokenBalance.load(event.address.toHexString()+ "_" + event.params.to.toHexString())
    if(toBalanceEntity == null){
        toBalanceEntity = new UserMeMeTokenBalance(event.address.toHexString() + "_" + event.params.to.toHexString())
        toBalanceEntity.user = event.params.to.toHexString()
        toBalanceEntity.token = event.address.toHexString()

        toBalanceEntity.createTimestamp = event.block.timestamp
        toBalanceEntity.tokenAmount = BigInt.fromString("0")
    }
    toBalanceEntity.tokenAmount = toBalanceEntity.tokenAmount.plus(event.params.value)
    toBalanceEntity.updateTimestamp = event.block.timestamp
    toBalanceEntity.save()
  }
  
 