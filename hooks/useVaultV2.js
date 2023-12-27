import { useState, useEffect } from "react";
import ADDRESSES from "../constants/RoeAddresses.json";
import { useWeb3React } from "@web3-react/core";
import VAULTV2_ABI from "../contracts/GoodEntryVault.json";
import ERC20_ABI from "../contracts/ERC20.json";
import useContract from "./useContract";
import { ethers } from "ethers";
import useGoodStats from "./useGoodStats";

var statsPeriod = "7d";

export default function useVaultV2(vault) {
  if (!vault) vault = {name: ""}

  const [reserves, setReserves] = useState({baseAmount: 0, quoteAmount: 0, valueX8: 0});
  const [maxTvl, setMaxTvl] = useState(0);
  const [fee0, setFee0] = useState(0);
  const [fee1, setFee1] = useState(0);
  const [feeApr, setApr] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userValue, setUserValue] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const { account } = useWeb3React();
  const address = vault.address;
  
  const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
  const vaultV2ContractWithSigner = useContract(address, VAULTV2_ABI);
  const vaultV2Contract = new ethers.Contract(address, VAULTV2_ABI, customProvider);

  var data = {
    address: address,
    name: vault.name,
    tvl: ethers.utils.formatUnits(reserves.valueX8, 8),
    maxTvl: maxTvl,
    totalSupply: totalSupply,
    fee0: fee0,
    fee1: fee1,
    feeApr: feeApr,
    totalApr: 0,
    wallet: userBalance,
    walletValue: userValue,
    contract: vaultV2ContractWithSigner,
    reserves: reserves,
    icon: "/icons/" + vault.name.toLowerCase() + ".svg",
  }
  
  useEffect( () => {
    const getData = async () => {
      //try {
        let tS = await vaultV2Contract.totalSupply()
        let tSupply = ethers.utils.formatUnits(tS, 18);
        setTotalSupply(tSupply);

        let tReserves = await vaultV2Contract.getReserves();
        let tValue = ethers.utils.formatUnits(tReserves.valueX8, 8);
        setReserves(tReserves);
        
        let uBal = ethers.utils.formatUnits(await vaultV2Contract.balanceOf(account), 18)
        setUserBalance(uBal);
        setUserValue(tValue == 0 ? 0 : tValue * uBal / tSupply);
        
        let tCap = ethers.utils.formatUnits(await vaultV2Contract.tvlCapX8(), 8).split('.')[0]
        setMaxTvl(tCap);
        
        // past fees, need to redeploy feeStreamer update
        let basePrice = await vaultV2Contract.getBasePrice();
        let price = ethers.utils.formatUnits(basePrice, 8)
        let today = Math.floor(new Date().getTime() / 86400000)

        let yester1Fees = await vaultV2Contract.getPastFees(today-1); // get [baseFees, quoteFees]
        let yester2Fees = await vaultV2Contract.getPastFees(today-2); // get [baseFees, quoteFees]

        let totalFees2Days = (yester1Fees[0].add(yester2Fees[0])) / 10**vault.baseToken.decimals * basePrice + (yester1Fees[1].add(yester2Fees[1]) * 100)
        let apr_ = totalFees2Days / tReserves.valueX8 * 36500 / 2;
        setApr(apr_)
        
        let f0 = await vaultV2Contract.getAdjustedBaseFee(true);
        let f1 = await vaultV2Contract.getAdjustedBaseFee(false);
        setFee0(f0/100);
        setFee1(f1/100);
      /*}
      catch(e){
        console.log("useVaultV2", vaultV2Contract.address, e)
      }*/
    }
    
    if (address && vaultV2Contract) {
      getData()
    }
  }, [address])

  return data;
}
