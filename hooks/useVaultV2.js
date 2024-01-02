import { useState, useEffect } from "react";
import ADDRESSES from "../constants/RoeAddresses.json";
import { useWeb3React } from "@web3-react/core";
import VAULTV2_ABI from "../contracts/GoodEntryVault.json";
import ERC20_ABI from "../contracts/ERC20.json";
import useContract from "./useContract";
import { ethers } from "ethers";
import axios from "axios";

var statsPeriod = "7d";

export default function useVaultV2(vault) {
  if (!vault) vault = {name: ""}

  const [reserves, setReserves] = useState({baseAmount: 0, quoteAmount: 0, tvl: 0});
  const [maxTvl, setMaxTvl] = useState(0);
  const [fee0, setFee0] = useState(0);
  const [fee1, setFee1] = useState(0);
  const [feeApr, setApr] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userValue, setUserValue] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const { account } = useWeb3React();
  const address = vault.address;
  
  const vaultV2ContractWithSigner = useContract(address, VAULTV2_ABI);

  var data = {
    address: address,
    name: vault.name,
    tvl: reserves.tvl / 1e8,
    maxTvl: maxTvl,
    totalSupply: totalSupply,
    feeApr: feeApr,
    wallet: userBalance,
    walletValue: userValue,
    contract: vaultV2ContractWithSigner,
    reserves: reserves,
    icon: "/icons/" + vault.name.toLowerCase() + ".svg",
  }
  
  useEffect( () => {
    const getData = async () => {
      try {
        const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
        const vaultV2Contract = new ethers.Contract(address, VAULTV2_ABI, customProvider);
        
        const statsUrl = "https://roe.nicodeva.xyz/stats/arbitrum/vaultStats/"+address+".json"
        var statsVault = (await axios.get(statsUrl)).data
        
        var totalSupply = parseInt(statsVault["totalSupply"])
        var tvl = parseInt(statsVault["tvl"])
        var tvlCap = parseInt(statsVault["tvlCap"])
        
        setTotalSupply(totalSupply);
        setReserves(statsVault);
        setMaxTvl(tvlCap / 1e8);
        
        let aprPerceived = 0
        for (let k = 0; k < statsVault.fees.length; k++){
          let thatDayFees = statsVault.fees[k]
          aprPerceived += parseInt(thatDayFees["feesX8"]) / parseInt(thatDayFees["tvlX8"])
        }
        setApr(aprPerceived * 36500 / statsVault.fees.length)
        
        let userBal = ethers.utils.formatUnits(await vaultV2Contract.balanceOf(account) , 18)
        setUserBalance(userBal || 0);
        setUserValue(totalSupply == 0 ? 0 : parseInt(statsVault["tvl"]) * userBal / totalSupply);
      }
      catch(e){
        console.log("useVaultV2", address, e)
      }
    }
    
    if (address) getData()
  }, [address, account])

  return data;
}
