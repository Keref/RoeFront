import { useState, useEffect } from "react";
import { Card, Typography } from 'antd';
import useAddresses from "../hooks/useAddresses";  
import GEPM_ABI from "../contracts/GoodEntryPositionManager.json";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

// Display all user assets and positions in all ROE LPs
const Positions = () => {
  const [positions, setPositions] = useState([])
  const ADDRESSES = useAddresses();
  let vaults = ADDRESSES["lendingPools"];
  const { library, account, chainId } = useWeb3React();

  useEffect(()=>{
    const getData = async() => {
      console.log(vaults, library, account)
      let pos = []
      for (let vault of vaults){
        console.log('get',vault.address, library )
        let pmContract = new ethers.Contract(vault.positionManagerV2, GEPM_ABI, library.getSigner(account));
        console.log('hasNFTs ', await pmContract.totalSupply())
        let nftSupply = await pmContract.totalSupply();

        for (let k = 0; k< nftSupply; k++){
          let positionId = await pmContract.tokenByIndex(k);
          let onePos = await pmContract.getPosition(positionId)
          
          console.log('kakui', {positionId: positionId, ...onePos})
          // optionType == 0: fixed option: data field gives endDate, after which 3rd party can close
          // OptionType == 1: streaming: function getFeesAccumulated(uint tokenId) public view returns (uint feesAccumulated), if feesAccumulated > collateralAmount -> can liquidate
          // feesDue >= position.collateralAmount - FIXED_EXERCISE_FEE // can get FIXED_EXERCISE_FEE with pm.getParameters, now it is 4e6 = 4 USDC
          console.log('op', onePos.optionType == 1)
          let feesAccumulated = onePos.optionType == 1 ? await pmContract.getFeesAccumulated(positionId) : 0

          pos.push({positionId: positionId, pmAddress: vault.positionManagerV2, name: vault.name, feesAccumulated: feesAccumulated, ...onePos})
        }
        setPositions(pos)
      }
      
    }
    if(library && account) getData()
  }, [vaults.length, account])
  console.log("positions", positions)
  
  
  const closePosition = async (pmAddress, positionId) => {
    let pmContract = new ethers.Contract(pmAddress, GEPM_ABI, library.getSigner(account));
    await pmContract.closePosition(positionId)
  }
  
  return (<div style={{ minWidth: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <img src="/images/1500x500.jpg" alt="GoodEntry Banner" width="800" style={{borderRadius: 5}}/>

    <Card style={{ width: 800, marginTop: 24}} >

      <table>
        <thead>
          <tr>
            <th align="left">PM</th>
            <th align="left">PosId</th>
            <th align="left">OptionType</th>
            <th align="left">StartDate</th>
            <th align="left">EndDate</th>
            <th align="left">Collat</th>
            <th align="left">Fees.Accum</th>
            <th align="right">Action</th>
          </tr>
        </thead>
        <tbody>
          {
            positions.map( (p) => {
              let canLiq = false;
              if (p.optionType == 0){
                let dd = new Date().getTime() / 1000;
                if (dd > p.data) canLiq = true
              } else if (p.optionType == 1){
                if (p.feesAccumulated > p.collateralAmount - 4e6) canLiq = true
              }
              console.log('canliqu', canLiq)
              let k = p.pmAddress+p.positionId.toString();
              return (<tr key={k}>
                <td>{p.name}</td>
                <td>{p.positionId.toString()}</td>
                <td>{p.optionType.toString()}</td>
                <td>{p.startDate.toString()}</td>
                <td>{p.optionType==0 ? p.data.toString() : "-"}</td>
                <td>{(p.collateralAmount - 4e6).toString()}</td>
                <td>{p.feesAccumulated.toString()}</td>
                <td align="right">
                  <button style={{ border: 0, backgroundColor: (canLiq ? "green" : "gray")}} onClick={()=>{closePosition(p.pmAddress, p.positionId)}} >Close</button>
                </td>
              </tr>)
            })
          }
        </tbody>
      </table>
    </Card>

  </div>);
  
}

export default Positions;