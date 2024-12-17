import {
    Sync as SyncEvent
  } from "../generated/NetswapPair/NetswapPair"
  import {
     TokenPriceChangeLog,
     LpToken
  } from "../generated/schema"
  
  import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
  
  export function handleSync(event: SyncEvent): void {
    let lpToken = LpToken.load(event.address.toHexString())

    if(lpToken == null){
        //must have lpToken entity
        return;
    }

    // id: ID!
    // token: String!
    // tokenPrice:BigInt!
    // amount0:BigInt
    // amount1:BigInt
    // type:String!
    // blockNumber: BigInt!
    // createTimestamp: BigInt!
    // transactionHash: Bytes!
    let changeLogEntity = new TokenPriceChangeLog(event.transaction.hash.toHexString())
    changeLogEntity.token = lpToken.token
    changeLogEntity.type = "swap"
    let tokenAmount:BigDecimal,currencyAmount:BigDecimal
    if(event.params.reserve0 > event.params.reserve1){
        tokenAmount = BigDecimal.fromString(event.params.reserve0.toString())
        currencyAmount = BigDecimal.fromString(event.params.reserve1.toString())
    }else{
        tokenAmount = BigDecimal.fromString(event.params.reserve1.toString())
        currencyAmount = BigDecimal.fromString(event.params.reserve0.toString())
    }
    const tenToEighteen:BigDecimal = BigDecimal.fromString(Math.pow(10, 18).toString());
    let price:BigDecimal = currencyAmount.div(tokenAmount).times(tenToEighteen)
    changeLogEntity.amount0 = event.params.reserve0
    changeLogEntity.amount1 = event.params.reserve1
    const integerPart = price.toString().split('.')[0]; // 去掉小数部分
    changeLogEntity.tokenPrice = BigInt.fromString(integerPart);
    changeLogEntity.createTimestamp = event.block.timestamp
    changeLogEntity.blockNumber = event.block.number
    changeLogEntity.transactionHash = event.transaction.hash

    changeLogEntity.save()
  }
  
 