import { useState, useEffect } from 'react'
import { Dropdown, Button, Card } from 'antd'
import axios from 'axios'
import VaultsDropdown from './vaultsDropdown'
import useOraclePrice from "../../hooks/useOraclePrice";
import {ethers} from 'ethers'

const Infobar = ({vaults, current, selectVault }) => {
  let [dailyCandle, setDailyCandle] = useState({})
  let [isDropdownVisible, setDropdownvisible ] = useState(false)
  let currentVault = vaults[current];
  let ohlcUrl = currentVault.ohlcUrl
  
  const price = useOraclePrice(vaults[current]);
  

  useEffect( () => {
    // get candles from geckoterminal
    async function getData() {
      try {
        let apiUrl = ohlcUrl + 'D&limit=1'
        const data = await axios.get(apiUrl, {withCredentials: false,})
        let candles = []
        // bybit format
        let dailyCandle = data.data.result.list[0]
        // push price up to main page
        setDailyCandle(dailyCandle)
      } catch(e) {console.log(e)}
    }
    const intervalId = setInterval(() => {
      if (ohlcUrl) getData();
    }, 20000);
    return () => { clearInterval(intervalId); };
  }, [ohlcUrl])

  let change = parseFloat(dailyCandle[1]) - parseFloat(dailyCandle[4])
  let changePercent = 100 * change / ( parseFloat(dailyCandle[1]) || 1 )

  let red = '#e57673' 
  let green = '#55d17c'
  
  return (<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 40 }}>
    <VaultsDropdown selectVault={selectVault} vaults={vaults} currentVault={currentVault} />
    
    <span style={{ fontSize: 'larger', color: 'white' }}>{price.toFixed(3)}</span>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h Change</span>
      <span style={{ color: change > 0 ? green:red }}>{change.toFixed(2)} {changePercent.toFixed(2)}%</span>
    </div> 
    
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h High</span>
      <span style={{ color: 'white' }}>{parseFloat(dailyCandle[2]??0).toFixed(2)}</span>
    </div> 
    
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h Low</span>
      <span style={{ color: 'white'}}>{parseFloat(dailyCandle[3]??0).toFixed(2)}</span>
    </div>
  </div>)
  
  
}


export default Infobar;