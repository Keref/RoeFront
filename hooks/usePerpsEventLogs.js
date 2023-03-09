import { useEffect, useState } from "react";import useAddresses from "./useAddresses";import useOptionsPositionManager from './useOptionsPositionManager'import { useWeb3React } from "@web3-react/core";import { ethers } from 'ethers'import axios from 'axios';const usePerpsEventLogs = (tickerAddress, vaultAddress) => {  const { account, library } = useWeb3React()    const ADDRESSES = useAddresses(vaultAddress);  const opm = useOptionsPositionManager()    const topicBuy = '0xa5808818cc29542869d3e14410861007c2f8b874237d3a996c5319b2fe18a4c9' // BuyOptions(...)  const topicClose = '0x16331435a4b4fc629446f9123c94a92e6a4d89b5305ceed74754276490cb02cf' // ClosePosition(...)  const apiKey = 'BYUIRGM2YBGEM36ZSC7PWW7DTAP8FY2KIW'  const url = library ?     'https://api.arbiscan.io/api?module=logs&action=getLogs&fromBlock=67050855&toBlock='+library._fastBlockNumber      +'&address='+ADDRESSES['optionsPositionManager']      +'&topic0_1_opr=and'      +'&topic1=0x000000000000000000000000'+account.substring(2,42)      +'&topic1_2_opr=and'      +(tickerAddress ? '&topic2=0x000000000000000000000000'+tickerAddress.substring(2,42) : '' )      +'&apikey='+apiKey     : undefined    const [data, setdata] = useState({});  useEffect(() => {    const getEvents = async () => {      const delay = ms => new Promise(res => setTimeout(res, ms));      await delay(4000) // delay bc on open new position arbitrum takes a while to update      try {        var eventsBuy = await axios.get(url+'&topic0='+topicBuy)        var eventsSell = await axios.get(url+'&topic0='+topicClose)        var events = eventsBuy.data.result.concat(eventsSell.data.result).sort( (a,b) => {return (Number(a.blockNumber) > Number(b.blockNumber)) ? -1 : 1})                console.log('events', events)                let hasSwapped = false        let token0Amount = 0        let token1Amount = 0        let data = {}                for (let e of events){          // currently no partial close: if ClosePosition event, exit          if (e.topics[0] == topicClose) break;                    data = e          // check tx logs:           let receipt = await library.getTransactionReceipt(e.transactionHash)          for (let log of receipt.logs){            if (log.topics[0] == "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822" ) hasSwapped = true; // swap topic            if (log.topics[0] == "0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951" ) { // deposit in LP              let amount = Number("0x" + log.data.substring(66, 130) )              if ( '0x'+log.topics[1].substring(26, 66) == ADDRESSES.lendingPools[0].token0.address.toLowerCase() ) token0Amount += amount              if ( '0x'+log.topics[1].substring(26, 66) == ADDRESSES.lendingPools[0].token1.address.toLowerCase() ) token1Amount += amount            }          }        }                data.hasSwapped = hasSwapped        data.token0Amount = token0Amount        data.token1Amount = token1Amount        console.log('firstts', data)        setdata(data)              }      catch(e) {        console.log('Get events', e)      }    }        if (tickerAddress && account) getEvents();  }, [tickerAddress, account]);  return data;}export default usePerpsEventLogs;