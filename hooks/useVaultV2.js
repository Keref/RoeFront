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

  const [tvl, setTvl] = useState(0);
  const [maxTvl, setMaxTvl] = useState(0);
  const [fee0, setFee0] = useState(0);
  const [fee1, setFee1] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userValue, setUserValue] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const { account } = useWeb3React();
  const address = vault.address;
  const vaultV2Contract = useContract(address, VAULTV2_ABI);
  const goodStats = useGoodStats();

  const feesRate = goodStats && goodStats[statsPeriod][address] ? parseFloat(goodStats[statsPeriod][address].feesRate) : 0;
  const supplyRate = goodStats && goodStats[statsPeriod][address] ? parseFloat(goodStats[statsPeriod][address].supplyRate) : 0;
  const airdropRate = goodStats && goodStats[statsPeriod] ? parseFloat(goodStats[statsPeriod].airdropRate) : 0;

  const tvl2 = goodStats && goodStats[statsPeriod][address] ? parseFloat(goodStats[statsPeriod][address].tvl) / 1e8 : 0;
  const maxTvl2 = goodStats && goodStats[statsPeriod][address] ? parseFloat(goodStats[statsPeriod][address].maxTvl || 0) / 1e8 : 0;


  var data = {
    address: address,
    name: vault.name,
    tvl: tvl,
    maxTvl: maxTvl,
    totalSupply: totalSupply,
    fee0: fee0,
    fee1: fee1,
    feeApr: feesRate,
    supplyApr: supplyRate,
    airdropApr: airdropRate,
    totalApr: 0,
    wallet: userBalance,
    walletValue: userValue,
    contract: vaultV2Contract,
    icon: "/icons/" + vault.name.toLowerCase() + ".svg",
  }
  
  useEffect( () => {
    const getData = async () => {
      try {
        let tS = await vaultV2Contract.totalSupply()
        let tSupply = ethers.utils.formatUnits(tS, 18);
        setTotalSupply(tSupply);
        
        let tTvl = await vaultV2Contract.getTVL();
        let tValue = ethers.utils.formatUnits(tTvl, 8);
        setTvl(tValue);
        
        let uBal = ethers.utils.formatUnits(await vaultV2Contract.balanceOf(account), 18)
        setUserBalance(uBal);
        setUserValue(tValue == 0 ? 0 : tValue * uBal / tSupply);
        
        let tCap = ethers.utils.formatUnits(await vaultV2Contract.tvlCap(), 8).split('.')[0]
        setMaxTvl(tCap);
        
        setFee0( (await vaultV2Contract.getAdjustedBaseFee(true) )/100 );
        setFee1( (await vaultV2Contract.getAdjustedBaseFee(false) )/100 );
      }
      catch(e){
        console.log("useVaultV2", vaultV2Contract.address, e)
      }
    }
    
    if (address && vaultV2Contract) {
      console.log('getdata', address, vaultV2Contract)
      getData()
    }
  }, [address, vaultV2Contract])

  return data;
}
