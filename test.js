import { stocks } from 'stock-api'

// 数据源
const tencent = stocks.tencent

tencent.searchStocks(['510500']).then(console.log)
