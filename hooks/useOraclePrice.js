import { useState, useEffect } from "react";
import useContract from "./useContract";
import Oracle_ABI from "../contracts/GoodEntryOracle.json";
import useAddresses from "./useAddresses";
import { ethers } from "ethers";

export default function useOraclePrice(baseAddress, quoteAddress) {
  const [price, setPrice] = useState(0);
  const ADDRESSES = useAddresses();
  const oracleContract = useContract(ADDRESSES["oracle"], Oracle_ABI);

  useEffect(() => {
    const getPrice = async () => {
      try {
        const basePrice = await oracleContract.getAssetPrice(baseAddress);
        const quotePrice = quoteAddress ? await oracleContract.getAssetPrice(baseAddress) * 1e8 : 1
        setPrice(basePrice / quotePrice / 1e8);
      }
      catch(e) {console.log("Error fetching Uniswap price", e)}
    };

    const intervalId = setInterval(() => {
      if (baseAddress && oracleContract) getPrice();
    }, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, [baseAddress, oracleContract]);

  return price;
}
