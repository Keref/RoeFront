import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useAddresses from "./useAddresses";
import useTokenBalance from "./useTokenBalance"
import useTokenContract from "./useTokenContract"
import usePriceOracle from "./usePriceOracle"
import useRangeStats from "./useRangeStats"
import useLendingPoolContract from "./useLendingPoolContract"
import { ethers } from "ethers";

/// Get an array with all data related to a symbol, eg USDC or ETH, including user balances and pool balance
/// @param address if a string, use that asset, if object, iterates over as a list of addresses
export default function useAssetData(address, vaultAddress) {
  const { account } = useWeb3React()
  const [roeSupply, setRoeSupply] = useState()
  const [ debt, setDebt ] = useState(0)
  const [price, setPrice] = useState(0)
  const [variableRate, setVariableRate] = useState(0)
  const [supplyRate, setSupplyRate] = useState(0)
  const ADDRESSES = useAddresses(vaultAddress)
  let lp = ADDRESSES['lendingPools'][0] || {};
  var asset;

  // will fail with Error: Rendered more hooks than during the previous render. if the asset address isnt found here, since it would skip some hooks
  if (lp.address){
    if ( address == lp['token0'].address) asset = {type: 'single', ...lp.token0}
    else if ( address == lp['token1'].address) asset = {type: 'single', ...lp.token1}
    else if ( address == lp['lpToken'].address) asset = {type: 'lpv2', ...lp.lpToken}
    else {
      // loop on ranges
      for ( let k of lp.ranges )
        if ( address == k.address ) asset = {type: 'ranger', name: 'Range-'+k.price, ...k}
      // loop on ticks
      
      for ( let k of lp.ticks )
        if ( address == k.address ) asset = {type: 'ticker', name: 'Tick-'+k.price, ...k}
    }
  }
  
  const rangeData = useRangeStats(asset && asset.tokenId)
  const baseApr = (rangeData.history_24h && rangeData.history_24h.length > 0) ? parseFloat(rangeData.history_24h[0].fee_apr).toFixed(2) : 5.1
  asset = { 
    supplyApr: supplyRate, 
    baseApr: baseApr,
    debtApr: variableRate,
    wallet: 0, deposited: 0, tlv: 0, 
    debt: debt,
    tlv: roeSupply,
    oraclePrice: price,
    rangeData: rangeData,
    ...asset
  }
  if (asset.name) asset.icon = "/icons/"+asset.name.split(/[\ -]/)[0].toLowerCase()+".svg";
  else asset.icon ="/favicon.ico";

  const oracle = usePriceOracle()
  const getPrice = async () => {
    try {
      var data = await oracle.getAssetPrice(address)
      setPrice( ethers.utils.formatUnits(data, 8) )
    } catch(e){console.error}
  }
  getPrice()

  // get token supply = TLV
  const roeToken = useTokenContract(asset.roeAddress);
  const getRoeSupply = async () => {
    try {
      var data = await roeToken.totalSupply()
      setRoeSupply( ethers.utils.formatUnits(data, asset.decimals) )
    } catch(e){console.error}
  }
  getRoeSupply()
  
  const debtContract = useTokenContract(asset.debtAddress);
  const getDebtAmount = async () => {
    if (!asset.debtAddress || !debtContract) return;
    try {
      var data = await debtContract.totalSupply()
      setDebt(ethers.utils.formatUnits(data, asset.decimals))
    } catch(e) { console.log('Get debt error', e)}
  }  
  getDebtAmount()
  
  // Get variable debt/supply rates
  const lpContract = useLendingPoolContract(lp.address)
  const getVariableRate = async () => {
    if (!address || !lp.address || !lpContract) return;
    try {
      var data = await lpContract.getReserveData(asset.address)
      setVariableRate( (data.currentVariableBorrowRate / 1e25).toFixed(2) )      
      setSupplyRate( (data.currentLiquidityRate / 1e25).toFixed(2) )      
    } catch(e){console.log('Get variable rate', e, asset.address)}
  }
  getVariableRate()

  
  {
    const { data } = useTokenBalance(account, asset.roeAddress)
    asset.deposited = ethers.utils.formatUnits(data ?? 0, asset.decimals) ?? 0
  } 
  
  {
    const { data } = useTokenBalance(account, asset.address)
    asset.wallet = ethers.utils.formatUnits(data ?? 0, asset.decimals) ?? 0
  }
  
  return asset;
}