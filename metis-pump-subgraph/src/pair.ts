import {
    Swap as SwapEvent
  } from "../generated/NetswapPair/NetswapPair"
  import {
     LpToken,
     Transaction
  } from "../generated/schema"
  
  import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
  
  export function handleSync(event: SwapEvent): void {
    let lpToken = LpToken.load(event.address.toHexString())

    // address indexed sender,
    // uint256 amount0In,
    // uint256 amount1In,
    // uint256 amount0Out,
    // uint256 amount1Out,
    // address indexed to
    if(lpToken == null){
        //must have lpToken entity
        return;
    }

//     type Transaction @entity{
//         id: ID!
//         type: String!
//         user: String!
//         token: String!
//         tokenName: String!
//         tokenAmount: BigInt!
//         metisAmount: BigInt!
//         tokenPrice:BigInt!
//         blockNumber: BigInt!
//         createTimestamp: BigInt!
//         transactionHash: Bytes!
//         from: String
//    }

// address indexed sender,
// uint256 amount0In,
// uint256 amount1In,
// uint256 amount0Out,
// uint256 amount1Out,
// address indexed to

    let transactionEntity = new Transaction(event.transaction.hash.toHexString())
    transactionEntity.token = lpToken.token
    transactionEntity.from = "swap"
    let compareRt=0
    if(event.params.amount0In.equals(BigInt.fromString('0'))){
        if(event.params.amount0Out > event.params.amount1In){
            compareRt = -1
        }else{
            compareRt = 1
        }
    }else{
        if(event.params.amount0In > event.params.amount1Out){
            compareRt = -1
        }else{
            compareRt = 1
        }
    }
    let tokenAmountIn:BigInt,tokenAmountOut:BigInt,currencyAmountIn:BigInt,currencyAmountOut:BigInt
    if(compareRt == -1){
        tokenAmountIn = event.params.amount0In
        tokenAmountOut = event.params.amount0Out
        currencyAmountIn = event.params.amount1In
        currencyAmountOut = event.params.amount1Out
    }else{
        tokenAmountIn = event.params.amount1In
        tokenAmountOut = event.params.amount1Out
        currencyAmountIn = event.params.amount0In
        currencyAmountOut = event.params.amount0Out
    }
    let tokenAmount:BigDecimal,currencyAmount:BigDecimal
    if(tokenAmountIn.equals(BigInt.fromString('0'))){
        transactionEntity.type = "BUY"
        transactionEntity.tokenAmount = tokenAmountOut
        transactionEntity.metisAmount = currencyAmountIn
        tokenAmount = BigDecimal.fromString(tokenAmountOut.toString())
        currencyAmount = BigDecimal.fromString(currencyAmountIn.toString())
    }else{
        transactionEntity.type = "SELL"
        transactionEntity.tokenAmount = tokenAmountIn
        transactionEntity.metisAmount = currencyAmountOut
        tokenAmount = BigDecimal.fromString(tokenAmountIn.toString())
        currencyAmount = BigDecimal.fromString(currencyAmountOut.toString())
    }
    const tenToEighteen:BigDecimal = BigDecimal.fromString(Math.pow(10, 18).toString());
    let priceC:BigInt = BigInt.fromString('0');
    if(!tokenAmount.equals(BigDecimal.fromString('0'))){
        let price:BigDecimal = currencyAmount.div(tokenAmount).times(tenToEighteen)
        const integerPart = price.toString().split('.')[0]; // 去掉小数部分
        priceC = BigInt.fromString(integerPart);
    }
    transactionEntity.tokenPrice = priceC;
    transactionEntity.createTimestamp = event.block.timestamp
    transactionEntity.blockNumber = event.block.number
    transactionEntity.transactionHash = event.transaction.hash

    transactionEntity.save()
  }

function compareAddressSize(addr1: string, addr2: string): number {
    // 标准化地址，确保去除空格，并小写，确保带 '0x'
    let address1 = Address.fromString(addr1)
    let address2 = Address.fromString(addr2)

    const value1 =  BigInt.fromUnsignedBytes(address1)
    const value2 = BigInt.fromUnsignedBytes(address2)
  
    if (value1.gt(value2)) return 1; // addr1 > addr2
    if (value1.lt(value2)) return -1; // addr1 < addr2
    return 0; // addr1 == addr2
  }
  
  
 