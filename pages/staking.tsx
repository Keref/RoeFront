import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Input, Button, Progress, Spin } from 'antd';
import { ethers } from "ethers";
import useAssetData from "../hooks/useAssetData";
import ESGOOD_ABI from "../contracts/esGOOD.json";
import ERC20_ABI from "../contracts/ERC20.json";
import useContract from "../hooks/useContract";
import { useWeb3React } from "@web3-react/core";

function Staking() {
  const { account, library } = useWeb3React();
  const [good, setGOOD] = useState({})
  const [esgood, setEsGOOD] = useState({})
  var GOOD_ADDRESS  = "0x1DE0bb9fA631387b5129B5c7F4154feEB42FAEee";
  var ESGOOD_ADDRESS = "0xC26B340971226b65cf5C86B5Afecf13d4FEc3546";
  
  const [tgeData, setTgeData] = useState({})
  const [amountGood, setAmountGood] = useState()
  const [amountEsGood, setAmountEsGood] = useState()
  const [isSpinning, setSpinning] = useState()
  const goodContract = useContract(GOOD_ADDRESS, ERC20_ABI)
  const esgoodContract = useContract(ESGOOD_ADDRESS, ESGOOD_ABI)

  useEffect(()=>{
    const getData = async () => {
      setGOOD({ balance: ethers.utils.formatUnits(await goodContract.balanceOf(account), 18) });
      var esg = {
        balance: ethers.utils.formatUnits((await esgoodContract.balanceOf(account)), 18),
        vestingLength: (await esgoodContract.getVestingLength(account)).toNumber(),
        vestingNfts: []
      }
      console.log(esg)
      for( let k = 0; k < esg.vestingLength; k++){
        let vestingNft = await esgoodContract.getVestingSchedule(k);
        console.log('getvsched', vestingNft)
        esg.vestingNfts.push(vestingNft)
        // function getVestingSchedule(uint vestingId) returns (uint256 vestedAmount, uint64 startTime, uint256 unlockedAmount, uint256 lockedAmount)
        // withdraw(address account, uint256 userVestingId)
      }
      setEsGOOD(esg)
    }
    if(goodContract && esgoodContract) getData()
  }, [goodContract, esgoodContract])
  
  const lockup = async () => {
    // function depositFor(address account, uint256 amount) public returns (bool)
    let am = ethers.utils.parseUnits(amountGood, 18)
    await esgoodContract.depositFor(account, am);
    // good is burnt and esgood is minted
  }
  
  const vest = async () => {
    // function vest(uint vestingAmount) public virtual returns (uint userVestingId)
    let am = ethers.utils.parseUnits(amountEsGood, 18)
    await esgoodContract.vest(am);
  }
  
  
  const withdraw = async (nftId) => {
    // function vest(uint vestingAmount) public virtual returns (uint userVestingId)
    await esgoodContract.withdraw(nftId);
  }
  
  
  return (
    <div style={{width: '100%', minWidth: '1200px'}}>
      <Typography.Title>Staking</Typography.Title>
        <Row gutter={24}>
        <Col span={12} >
          <Card style={{ marginBottom: '20px'}} title="Revenues">
            <div>GOOD Balance: {good.balance} $GOOD</div>
            <div>esGOOD Balance: {esgood.balance} $GOOD</div>
            <div>Pending Earnings: {esgood.pendingUsd} $USDC</div>
            <div>
              <Button type="default" style={{ width: "200px" }}>Claim USDC</Button>
            </div>
            <hr/>
            <div>
              <Input
                placeholder="Amount $GOOD"
                onChange={(e) => setAmountGood(e.target.value)}
                key="inputamount"
                value={amountGood}
                style={{ backgroundColor: "#1D2329", padding: 8, color: 'white' }}
              />
              <Button type="default" style={{ width: "200px" }} onClick={lockup} >Lockup</Button>
            </div>
            <hr/>
            <div>
              <Input
                placeholder="Amount $GOOD"
                onChange={(e) => setAmountEsGood(e.target.value)}
                key="inputamount"
                value={amountEsGood}
                style={{ backgroundColor: "#1D2329", padding: 8, color: 'white' }}
              />
              <Button type="default" style={{ width: "200px" }} onClick={vest} >Vest $esGood to $GOOD</Button>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card>
          <h2>Vesting NFT</h2>
          Loop on <strong>{esgood.vestingLength}</strong> NFT list and display amount, lockup time remaining<br/>
          Unlock early button will redeem NFT unlockedAmount $GOOD, and burn remaining lockedAmount
          
          {
            esgood.vestingNfts ? esgood.vestingNfts.map((nft) => {
              return (<>
                <hr/>
                Amount: {ethers.utils.formatUnits(nft.vestedAmount, 18)}<br/>
                Start Date: {new Date(nft.startTime.toNumber()).toString()}<br/>
                Unlocked: {ethers.utils.formatUnits(nft.unlockedAmount, 18)} <br/>
                Remaining: {ethers.utils.formatUnits(nft.lockedAmount, 18)} <br/>
                <Button onClick={() => {withdraw(1)}}>Redeem early</Button>
              </>)
            }) : <></>
          }
          
          </Card>
        </Col>
        </Row>
    </div>
  );
}

export default Staking;