import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useAddresses from "./useAddresses";
import useTokenBalance from "./useTokenBalance";
import useTokenContract from "./useTokenContract";
import usePriceOracle from "./usePriceOracle";
import useGoodStats from "./useGoodStats";
import useLendingPoolContract from "./useLendingPoolContract";
import { ethers } from "ethers";

/// Get an array with all data related to a symbol, eg USDC or ETH, including user balances and pool balance
/// @param address if a string, use that asset, if object, iterates over as a list of addresses
export default function useAssetData(address, vaultAddress) {
  const { account } = useWeb3React();
  const [totalSupply, setTotalSupply] = useState();
  const [roeTotalSupply, setRoeTotalSupply] = useState(0);
  const [debt, setDebt] = useState(0);
  const [price, setPrice] = useState(0);
  const [variableRate, setVariableRate] = useState(0);
  const [supplyRate, setSupplyRate] = useState(0);
  const [deposited, setDeposited] = useState(0);
  const ADDRESSES = useAddresses(vaultAddress);
  let lp = ADDRESSES["lendingPools"][0] || {};
  var asset = {
    icon: "/favicon.ico",
  };

  // will fail with Error: Rendered more hooks than during the previous render. if the asset address isnt found here, since it would skip some hooks
  if (lp.address) {
    if (address == lp["token0"].address)
      asset = { type: "single", ...lp.token0 };
    else if (address == lp["token1"].address)
      asset = { type: "single", ...lp.token1 };
    else if (address == lp["lpToken"].address)
      asset = { type: "lpv2", ...lp.lpToken };
    else if (address == lp["geVault"])
      asset = { type: "geVault", name: "GoodVault "+lp.name, address: address,
        icon: "/icons/" + lp.name.toLowerCase() + ".svg",
      }
    else {
      // loop on ranges
      for (let k of lp.ranges)
        if (address == k.address)
          asset = { type: "ranger", name: "Range-" + k.price, ...k };
      // loop on ticks

      for (let k of lp.ticks)
        if (address == k.address) {
          asset = {
            type: "ticker",
            name: "Ticker-" + k.price,
            icon: "/icons/" + lp.name.toLowerCase() + ".svg",
            ...k,
          };
        }
    }
  }
  if (asset.name && asset.type != "ticker" && asset.type != "geVault")
    asset.icon = "/icons/" + asset.name.toLowerCase() + ".svg";
  const goodStats = useGoodStats();
  const feeApr = goodStats && goodStats["7d"][address] ? goodStats["7d"][address].apr : 0;
  asset = {
    supplyApr: supplyRate,
    feeApr: feeApr,
    debtApr: variableRate,
    totalApr: supplyRate + feeApr + variableRate,
    wallet: 0,
    deposited: 0,
    debt: debt,
    tvl: totalSupply * price,
    totalSupply: totalSupply,
    roeTotalSupply: roeTotalSupply,
    oraclePrice: price,
    deposited: deposited,
    ...asset,
  };

  const oracle = usePriceOracle();
  const getPrice = async () => {
    if (!oracle || !address) return;
    try {
      var data = await oracle.getAssetPrice(address);
      setPrice(ethers.utils.formatUnits(data, 8));
    } catch (e) {
      //console.log('get oracle asset price', e, oracle, address);
    }
  };
  getPrice();

  const assetContract = useTokenContract(address);
  const getAssetData = async () => {
    try {
      if (!assetContract) return;
      var data = await assetContract.balanceOf(asset.roeAddress);
      setTotalSupply(ethers.utils.formatUnits(data, asset.decimals));
    } catch (e) {
      //console.log('get asset data error', e)
    }
  };
  getAssetData();

  // get token supply = TVL
  const roeToken = useTokenContract(asset.roeAddress);
  const getRoeSupply = async () => {
    try {
      var data = await roeToken.totalSupply();
      setRoeTotalSupply(ethers.utils.formatUnits(data, asset.decimals));
      data = await roeToken.balanceOf(account);
      setDeposited(ethers.utils.formatUnits(data, asset.decimals));
    } catch (e) {
      //console.error
    }
  };
  getRoeSupply();

  const debtContract = useTokenContract(asset.debtAddress);
  const getDebtAmount = async () => {
    if (!asset.debtAddress || !debtContract) return;
    try {
      var data = await debtContract.balanceOf(account);
      setDebt(ethers.utils.formatUnits(data, asset.decimals));
    } catch (e) {
      //console.log('Get debt error', e,debtContract, account )
    }
  };
  getDebtAmount();

  // Get variable debt/supply rates
  const lpContract = useLendingPoolContract(lp.address);
  const getVariableRate = async () => {
    if (!asset || !asset.address || !lp.address || !lpContract) return;
    try {
      var data = await lpContract.getReserveData(asset.address);
      setVariableRate((data.currentVariableBorrowRate / 1e25).toFixed(2));
      setSupplyRate((data.currentLiquidityRate / 1e25).toFixed(2));
    } catch (e) {
      //console.log('Get variable rate', e, asset.address)
    }
  };
  getVariableRate();

  {
    const { data } = useTokenBalance(account, asset.address);
    asset.wallet = ethers.utils.formatUnits(data ?? 0, asset.decimals) ?? 0;
  }
  asset.depositedValue = (asset.deposited / asset.totalSupply) * asset.tvl;

  return asset;
}
