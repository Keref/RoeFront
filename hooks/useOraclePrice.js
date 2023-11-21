import { useState, useEffect } from "react";
import useContract from "./useContract";
import GEV_ABI from "../contracts/GoodEntryVault.json";
import useAddresses from "./useAddresses";
import { ethers } from "ethers";

export default function useOraclePrice(vault) {
  const [price, setPrice] = useState(0);
  const vaultContract = useContract(vault.address, GEV_ABI);

  useEffect(() => {
    const getPrice = async () => {
      try {
        const basePrice = await vaultContract.getBasePrice();
        setPrice(basePrice / 1e8);
      }
      catch(e) {console.log("Error fetching Uniswap price", e)}
    };

    const intervalId = setInterval(() => {
      if (vault.address && vaultContract) getPrice();
    }, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, [vault.address, vaultContract]);

  return price;
}
