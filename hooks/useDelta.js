import { useState, useEffect } from "react";
import useContract from "./useContract";
import PM_ABI from "../contracts/GoodEntryPositionManager.json";
import useAddresses from "./useAddresses";
import { ethers } from "ethers";

export default function useDelta(vault) {
  const [delta, setDelta] = useState(0);
  //const vaultContract = useContract(vault.address, GEV_ABI);

  const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
  const pmContract = new ethers.Contract(vault.positionManagerV2, PM_ABI, customProvider);
  const vaultContract = new ethers.Contract(vault.address, GEV_ABI, customProvider);

  useEffect(() => {
    const getDelta = async () => {
      try {
        const posLength = await pmContract.getOpenStrikesLength();
        const basePrice = await vaultContract.getBasePrice();
        console.log("vault pos len", posLength)
        for (let k =0; k < posLength; k++){
          const callsk = await pmContract.strikeToOpenInterestCalls(k);
          const putsk = await pmContract.strikeToOpenInterestPuts(k);
          
        }
      }
      catch(e) {console.log("Error calc vault delta", e)}
    };

    if (vault.address && vaultContract && pmContract) getDelta();
  }, [vault.address, vaultContract, pmContract]);

  return price;
}
