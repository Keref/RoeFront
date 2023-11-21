import { useEffect, useState } from "react";
import axios from "axios";


const usePositionsHistory = (account, vault, refresh) => {
  const [data, setdata] = useState({});
  // get 
  /* https://api.arbiscan.io/api?module=logs&action=getLogs
       &toBlock=22524653
       &topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
       &topic0_1_opr=and
       &topic1=0x0000000000000000000000000000000000000000000000000000000000000000
       &page=1
       &offset=1000
       &apikey=YourApiKeyToken
  */
  var url = ""
  
  useEffect(() => {
    const getData = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      //console.log('Check history')
      try {
        const url = "https://roe.nicodeva.xyz/stats/arbitrum/getx.json?timestamp="+(new Date().getTime())
        var dataraw = (await axios.get(url)).data;

        if (dataraw[account]) setdata(dataraw[account])
      }
      catch(e) {
        console.log("PositionsHistory data", e)
      }
    }
    //if (account && vault) getData();
  }, [account, vault, refresh]);
  return data;
}

export default usePositionsHistory;