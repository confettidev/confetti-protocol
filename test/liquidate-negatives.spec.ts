import BigNumber from "bignumber.js";

import {
  advanceTimeAndBlock,
  DRE,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import {
  APPROVAL_AMOUNT_LENDING_POOL,
  oneEther,
  ONE_DAY,
} from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { makeSuite } from "./helpers/make-suite";
import { ProtocolErrors, ProtocolLoanState } from "../helpers/types";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation negtive test cases", (testEnv) => {
  before("Before liquidation: set config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
  });

  after("After liquidation: reset config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("User 0 deposit 100 WETH, user 1 mint NFT and borrow 10 WETH", async () => {
    const { weth, bayc, pool, users, dataProvider } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // user 0 mint and deposit 100 WETH
    await weth
      .connect(user0.signer)
      .mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth
      .connect(user0.signer)
      .approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "100");
    await pool
      .connect(user0.signer)
      .deposit(weth.address, amountDeposit, user0.address, "0");

    // user 1 mint NFT and borrow 10 WETH
    await weth
      .connect(user1.signer)
      .mint(await convertToCurrencyDecimals(weth.address, "5"));
    await weth
      .connect(user1.signer)
      .approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await bayc.connect(user1.signer).mint("101");
    await bayc.connect(user1.signer).setApprovalForAll(pool.address, true);
    const amountBorrow = await convertToCurrencyDecimals(weth.address, "10");
    await pool
      .connect(user1.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        user1.address,
        "0"
      );

    // user 2, 3 mint 100 WETH
    await weth
      .connect(user2.signer)
      .mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth
      .connect(user2.signer)
      .approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await weth
      .connect(user3.signer)
      .mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth
      .connect(user3.signer)
      .approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    const loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 1 = " + loanData.state);
  });

  it("User 1 liquidate on a non-existent NFT", async () => {
    const { configurator, bayc, pool, users, dataProvider } = testEnv;
    const user1 = users[1];

    const loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 2 = " + loanData.state);

    await expect(
      pool.connect(user1.signer).liquidate(bayc.address, "102", "0")
    ).to.be.revertedWith(ProtocolErrors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);
    console.log("loanData.state 1 = " + loanData.state);
  });
  /* Can not deactive Reserve or NFT when liquidity is not zero
  it("User 2 buyItNow on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).auction(bayc.address, "101", "0", user2.address)).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 liquidate on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).liquidate(bayc.address, "101", "0")).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 auction on a non-active Reserve", async () => {
    const { configurator, weth, bWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).auction(bayc.address, '101', '0', user2.address)
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });

  it("User 2 liquidate on a non-active Reserve", async () => {
    const { configurator, weth, bWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).liquidate(bayc.address, '101', '0')
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });
*/
  it("User 2 buyItNow on a loan health factor above 1", async () => {
    const { bayc, pool, users, dataProvider } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );

    let loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 3 = " + loanData.state);

    await expect(
      pool
        .connect(user2.signer)
        .buyItNow(bayc.address, "101", liquidatePrice, user2.address)
    ).to.be.revertedWith(
      ProtocolErrors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD
    );
    loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
    console.log("loanData.state 3.5 = " + loanData.state);
  });

  it("Drop loan health factor below 1", async () => {
    const { bayc, nftOracle, pool, users, dataProvider } = testEnv;

    const poolLoanData = await pool.getNftDebtData(bayc.address, "101");
    const baycPrice = new BigNumber(poolLoanData.totalDebt.toString())
      .percentMul(new BigNumber(5000)) // 50%
      .toFixed(0);
    await advanceTimeAndBlock(100);
    await nftOracle.setAssetData(bayc.address, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setAssetData(bayc.address, baycPrice);

    const loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 4 = " + loanData.state);
  });

  it("User 2 buyItNow price is unable to cover borrow", async () => {
    const { bayc, pool, users, dataProvider } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );

    let loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 5 = " + loanData.state);

    await expect(
      pool
        .connect(user2.signer)
        .buyItNow(bayc.address, "101", liquidatePrice, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BUYITNOW_PRICE_LESS_THAN_BORROW);

    loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
    console.log("loanData.state 5.5 = " + loanData.state);
  });

  it("User 2 buyItNow price is less than liquidate price", async () => {
    const { weth, bayc, nftOracle, pool, users, dataProvider } = testEnv;
    const user2 = users[2];

    const nftColData = await pool.getNftCollateralData(
      bayc.address,
      weth.address
    );
    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");
    // Price * LH / Debt = HF => Price * LH = Debt * HF => Price = Debt * HF / LH
    // LH is 2 decimals
    const baycPrice = new BigNumber(nftDebtData.totalDebt.toString())
      .percentMul(new BigNumber(9500)) //95%
      .percentDiv(new BigNumber(nftColData.liquidationThreshold.toString()))
      .toFixed(0);

    await advanceTimeAndBlock(100);
    await nftOracle.setAssetData(bayc.address, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setAssetData(bayc.address, baycPrice);

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );

    const buyItNowPriceFail = new BigNumber(liquidatePrice.toString())
      .multipliedBy(0.8)
      .toFixed(0);

    let loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 6 = " + loanData.state);

    await expect(
      pool
        .connect(user2.signer)
        .buyItNow(bayc.address, "101", buyItNowPriceFail, user2.address)
    ).to.be.revertedWith(
      ProtocolErrors.LPL_BUYITNOW_PRICE_LESS_THAN_LIQUIDATION_PRICE
    );
    loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
    console.log("loanData.state 6.5 = " + loanData.state);
  });

  it("User 2 buyItNow price is enough to cover borrow and liqudiate price", async () => {
    const { bayc, pool, users, dataProvider } = testEnv;
    const user2 = users[2];

    let loanData = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );
    console.log("loanData.state 7= " + loanData.state);

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );

    loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
    console.log("loanData.state 7.5 = " + loanData.state);

    const buyItNowPriceOk = new BigNumber(liquidatePrice.toString())
      .multipliedBy(1.5)
      .toFixed(0);
    console.log("buyItNowPriceOk = " + buyItNowPriceOk);
    console.log("liquidatePrice.toString() = " + liquidatePrice.toString());
    await waitForTx(
      await pool
        .connect(user2.signer)
        .buyItNow(bayc.address, "101", buyItNowPriceOk, user2.address)
    );
    loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
    console.log("loanData.state 8 = " + loanData.state);
  });

  // can remove this test case. will not have multiple bids
  // it("User 3 buyItNow price is lesser than user 2", async () => {
  //   const { bayc, pool, users, dataProvider } = testEnv;
  //   const user3 = users[3];

  //   const { liquidatePrice } = await pool.getNftLiquidatePrice(bayc.address, "101");
  //   const buyItNowSellPrice = new BigNumber(liquidatePrice.toString()).multipliedBy(1.2).toFixed(0);
  //   const loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
  //   console.log("loanData.state = " + loanData.state);

  //   await expect(
  //     pool.connect(user3.signer).buyItNow(bayc.address, "101", buyItNowSellPrice, user3.address)
  //   ).to.be.revertedWith(ProtocolErrors.LPL_BUYITNOW_PRICE_LESS_THAN_HIGHEST_PRICE);
  // });

  // it("User 2 liquidate before buyItNow duration is end", async () => {
  //   const { bayc, pool, users, dataProvider } = testEnv;
  //   const user2 = users[2];
  //   let loanData = await dataProvider.getLoanDataByCollateral(
  //     bayc.address,
  //     "101"
  //   );
  //   console.log("loanData.state 9 = " + loanData.state);
  //   const { liquidatePrice } = await pool.getNftLiquidatePrice(
  //     bayc.address,
  //     "101"
  //   );
  //   console.log("liquidatePrice = " + liquidatePrice);
  //   await pool.connect(user2.signer).liquidate(bayc.address, "101", "0");

  //   const tokenOwner = await bayc.ownerOf("101");
  //   expect(tokenOwner).to.be.equal(
  //     user2.address,
  //     "Invalid token owner after liquidation"
  //   );

  //   loanData = await dataProvider.getLoanDataByCollateral(bayc.address, "101");
  //   console.log("loanData.state 10 = " + loanData.state);
  // });

  it("User 1 redeem but buyItNowFine is not fullfil to borrow amount of user 2 buyItNow", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the buyItNow fine
    const nftBuyItNowData = await pool.getNftBuyItNowData(bayc.address, "101");
    const redeemAmount = nftBuyItNowData.buyItNowBorrowAmount;
    const badBuyItNowFine = new BigNumber(
      nftBuyItNowData.buyItNowFine.toString()
    )
      .multipliedBy(0.9)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBuyItNowFine)
    ).to.be.revertedWith(ProtocolErrors.LPL_INVALID_BUYITNOW_FINE);
  });

  it("User 1 redeem but amount is not fullfil to mininum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the buyItNow fine (user 2 buyItNow price)
    const nftBuyItNowData = await pool.getNftBuyItNowData(bayc.address, "101");
    const redeemAmount = nftBuyItNowData.buyItNowBorrowAmount.div(2);

    const badBuyItNowFine = new BigNumber(
      nftBuyItNowData.buyItNowFine.toString()
    )
      .multipliedBy(1.1)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBuyItNowFine)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD);
  });

  it("User 1 redeem but amount is not fullfil to maximum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the buyItNow fine (user 2 buyItNow price)
    const nftBuyItNowData = await pool.getNftBuyItNowData(bayc.address, "101");
    const redeemAmount = nftBuyItNowData.buyItNowBorrowAmount.mul(2);

    const badBuyItNowFine = new BigNumber(
      nftBuyItNowData.buyItNowFine.toString()
    )
      .multipliedBy(1.1)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBuyItNowFine)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_GREATER_THAN_MAX_REPAY);
  });

  it("Ends redeem duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);

    await increaseTime(
      nftCfgData.redeemDuration.mul(ONE_DAY).add(100).toNumber()
    );
  });

  it("User 1 redeem after duration is end", async () => {
    const { bayc, pool, users, dataProvider } = testEnv;
    const user1 = users[1];

    const nftBuyItNowData = await pool.getNftBuyItNowData(bayc.address, "101");
    const redeemAmount = nftBuyItNowData.buyItNowBorrowAmount.div(2);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, nftBuyItNowData.buyItNowFine)
    ).to.be.revertedWith(ProtocolErrors.LPL_BUYITNOW_REDEEM_DURATION_HAS_END);
  });

  it("Ends buyItNow duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    const deltaDuration = nftCfgData.buyItNowDuration.sub(
      nftCfgData.redeemDuration
    );

    await increaseTime(deltaDuration.mul(ONE_DAY).add(100).toNumber());
  });

  it("User 3 buyItNow after duration is end", async () => {
    const { bayc, pool, users } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    const buyItNowSellPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(2.0)
      .toFixed(0);

    await expect(
      pool
        .connect(user2.signer)
        .buyItNow(bayc.address, "101", buyItNowSellPrice, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BUYITNOW_DURATION_HAS_END);
  });
});
