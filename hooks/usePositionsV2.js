import { useState, useEffect } from "react";
import useContract from "./useContract";
import GoodEntryPositionManager_ABI from "../contracts/GoodEntryPositionManager.json";
import { ethers } from "ethers";


export default function usePositionsV2(account, pmAddress, refresh) {
  const [nfts, setNfts] = useState([]);
  const pmContract = useContract(pmAddress, GoodEntryPositionManager_ABI);

  useEffect(() => {
    console.log('get pos refres', refresh)
    const getNfts = async () => {
      try {
        console.log('refs now')
        const nftsTmp = []
        const nftsLength = await pmContract.balanceOf(account)
        console.log('how many fts', nftsLength)
        for (let k = 0; k < nftsLength; k++){
          const positionId = await pmContract.tokenOfOwnerByIndex(account, k)
          let n = await pmContract.getPosition(positionId)
          let feesAccumulated = await pmContract.getFeesAccumulated(positionId)
          nftsTmp.push({positionId: positionId, feesAccumulated: feesAccumulated, ...n})
          console.log()
          await setNfts(nftsTmp)
        }
        await setNfts(nftsTmp)
      }
      catch(e) {console.log("Error fetching NFTs", e)}
    };


    if (pmAddress && pmContract) getNfts();
  }, [pmAddress, pmContract, refresh]);

  return nfts;
}
