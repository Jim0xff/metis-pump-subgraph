import {
  BuyToken as BuyTokenEvent,
  Initialized as InitializedEvent,
  RecoverErc20 as RecoverErc20Event,
  SellToken as SellTokenEvent,
  TokenCreated as TokenCreatedEvent,
  TokenLiqudityAdded as TokenLiqudityAddedEvent
} from "../generated/TokenFactory/TokenFactory"
import {
  Token,
  Transaction,
  UserTokenBalance,
  UserMeMeTokenBalance,
  LpToken,
} from "../generated/schema"

import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleTokenCreated(event: TokenCreatedEvent): void {
  let entity = new Token(
     event.params.token.toHexString()
  )
  entity.totalSupply = BigInt.fromString("1000000000000000000000000000")
  entity.remainSupply = BigInt.fromString("800000000000000000000000000")
  entity.fundingGoal = event.params.timestamp
  entity.name = event.params.tokenName
  entity.nameLowercase = event.params.tokenName.toLowerCase()
  entity.symbol = event.params.tokenSymbol
  entity.description = event.params.description
  entity.imgUrl = event.params.imgUrl
  entity.status = 'FUNDING'
  entity.creator = event.params.creator.toHexString()
  entity.collateral = BigInt.fromString("0")
  entity.blockNumber = event.block.number
  entity.createTimestamp = event.block.timestamp
  entity.updateTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.nowPrice = event.params.tokenNowPrice
  entity.currencyAddress = event.params.currencyAddress.toHexString()
  entity.save()

  let userMeMeTokenBalanceEntity = new UserMeMeTokenBalance(event.params.token.toHexString() + "_" + event.address.toHexString())
  
  userMeMeTokenBalanceEntity.user = event.address.toHexString()
  userMeMeTokenBalanceEntity.token = event.params.token.toHexString()
  userMeMeTokenBalanceEntity.tokenName = event.params.tokenName
  userMeMeTokenBalanceEntity.tokenAmount = BigInt.fromString("1000000000000000000000000000")
  userMeMeTokenBalanceEntity.createTimestamp = event.block.timestamp
  userMeMeTokenBalanceEntity.updateTimestamp = event.block.timestamp
  userMeMeTokenBalanceEntity.save()
}

export function handleBuyToken(event: BuyTokenEvent): void {
  let entity = new Transaction(
    event.transaction.hash.toHexString()
  )

  entity.type = 'BUY'
  entity.from = 'boundingCurve'
  entity.user = event.params.buyer.toHexString()
  entity.token = event.params.token.toHexString()
  entity.tokenName = event.params.tokenName
  entity.tokenAmount = event.params.tokenAmount
  entity.metisAmount = event.params.metisAmount
  let tokenAmount:BigDecimal = BigDecimal.fromString(entity.tokenAmount.toString())
  let currencyAmount:BigDecimal = BigDecimal.fromString(entity.metisAmount.toString())
  const tenToEighteen:BigDecimal = BigDecimal.fromString(Math.pow(10, 18).toString());
  let tokenPriceC = event.params.tokenNowPrice
  //直接取当前价格
  // if(!tokenAmount.equals(BigDecimal.fromString('0'))){
  //   let price:BigDecimal = currencyAmount.div(tokenAmount).times(tenToEighteen)
  //   const integerPart = price.toString().split('.')[0]; // 去掉小数部分
  //   tokenPriceC = BigInt.fromString(integerPart);
  // }
  entity.tokenPrice = tokenPriceC

  entity.blockNumber = event.block.number
  entity.createTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let userBalanceEntity = UserTokenBalance.load(event.params.token.toHexString()+ "_" + event.params.buyer.toHexString())
  if(userBalanceEntity == null){
    userBalanceEntity = new UserTokenBalance(event.params.token.toHexString()+ "_" + event.params.buyer.toHexString())
    userBalanceEntity.user = event.params.buyer.toHexString()
    userBalanceEntity.token = event.params.token.toHexString()
    userBalanceEntity.tokenName = event.params.tokenName
    userBalanceEntity.createTimestamp = event.block.timestamp
    userBalanceEntity.tokenAmount = BigInt.fromString("0")
  }

  userBalanceEntity.tokenAmount = userBalanceEntity.tokenAmount.plus(event.params.tokenAmount)
  userBalanceEntity.updateTimestamp = event.block.timestamp
  userBalanceEntity.save();

  let tokenEntity = Token.load(event.params.token.toHexString())
  if(tokenEntity != null){
    tokenEntity.nowPrice = event.params.tokenNowPrice
    tokenEntity.remainSupply = tokenEntity.remainSupply.minus(event.params.tokenAmount)
    tokenEntity.blockNumber = event.block.number
    tokenEntity.updateTimestamp = event.block.timestamp
    tokenEntity.transactionHash = event.transaction.hash
    tokenEntity.collateral = event.params.collateral
    tokenEntity.save();
  }
}

export function handleSellToken(event: SellTokenEvent): void {
  let entity = new Transaction(
    event.transaction.hash.toHexString()
  )

  entity.type = 'SELL'
  entity.from = 'boundingCurve'
  entity.user = event.params.seller.toHexString()
  entity.token = event.params.token.toHexString()
  entity.tokenName = event.params.tokenName
  entity.tokenAmount = event.params.tokenAmount
  entity.metisAmount = event.params.metisAmount
  let tokenAmount:BigDecimal = BigDecimal.fromString(entity.tokenAmount.toString())
  let currencyAmount:BigDecimal = BigDecimal.fromString(entity.metisAmount.toString())
  const tenToEighteen:BigDecimal = BigDecimal.fromString(Math.pow(10, 18).toString());
  let tokenPriceC = event.params.tokenNowPrice
  // if(!tokenAmount.equals(BigDecimal.fromString('0'))){
  //   let price:BigDecimal = currencyAmount.div(tokenAmount).times(tenToEighteen)
  //   const integerPart = price.toString().split('.')[0]; // 去掉小数部分
  //   tokenPriceC = BigInt.fromString(integerPart);
  // }
  entity.tokenPrice = tokenPriceC
  entity.blockNumber = event.block.number
  entity.createTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let userBalanceEntity = UserTokenBalance.load(event.params.token.toHexString()+ "_" + event.params.seller.toHexString())
  if(userBalanceEntity != null){
    userBalanceEntity.tokenAmount = userBalanceEntity.tokenAmount.minus(event.params.tokenAmount)
    userBalanceEntity.updateTimestamp = event.block.timestamp
    userBalanceEntity.save();
  }
  let tokenEntity = Token.load(event.params.token.toHexString())
  if(tokenEntity != null){
    tokenEntity.nowPrice = event.params.tokenNowPrice
    tokenEntity.remainSupply = tokenEntity.remainSupply.plus(event.params.tokenAmount)
    tokenEntity.blockNumber = event.block.number
    tokenEntity.updateTimestamp = event.block.timestamp
    tokenEntity.transactionHash = event.transaction.hash
    tokenEntity.collateral = event.params.collateral
    tokenEntity.save();
  }
}

export function handleTokenLiqudityAdded(event: TokenLiqudityAddedEvent): void {
  let entity = Token.load(event.params.token.toHexString())
  if(entity != null){
    entity.status = 'TRADING'
    entity.blockNumber = event.block.number
    entity.updateTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash
    entity.pairAddress = event.params.lpToken.toHexString()
    entity.save()
    let lpTokenEntity = LpToken.load(event.params.lpToken.toHexString())
    if(lpTokenEntity == null){
      lpTokenEntity = new LpToken(event.params.lpToken.toHexString())
      lpTokenEntity.token = event.params.token.toHexString()
      lpTokenEntity.currency = entity.currencyAddress
      lpTokenEntity.blockNumber = event.block.number
      lpTokenEntity.createTimestamp = event.block.timestamp
      lpTokenEntity.updateTimestamp = event.block.timestamp
      lpTokenEntity.transactionHash = event.transaction.hash
      lpTokenEntity.save()
    }
  }

}