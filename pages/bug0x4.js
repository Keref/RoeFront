import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Input, Button, Progress, Spin } from 'antd';
import { ethers } from "ethers";
import useAssetData from "../hooks/useAssetData";
import LP_ABI from "../contracts/AaveLendingPool.json";
import TR_ABI from "../contracts/TokenizableRange.json";
import ERC20_ABI from "../contracts/ERC20.json";
import useContract from "../hooks/useContract";
import { useWeb3React } from "@web3-react/core";

function Bug0x4() {
  const { account, library } = useWeb3React();
  const [aToken1800, setAToken1800] = useState()
  const [token1800, setToken1800] = useState()
  var TOKEN1800_ADDRESS  = "0x5c09C0194FC89CcDAe753f348D1534108F29e90a";
  var ATOKEN1800_ADDRESS = "0xfd12eda9A6Ac984168C737d130AD0457aEE6287B";
  var LP_ADDRESS = "0x1259F436D981c1DA8b279205b5dc405B1f6Bf80b";
  
  const [tgeData, setTgeData] = useState({})
  const [amountGood, setAmountGood] = useState()
  const [amountEsGood, setAmountEsGood] = useState()
  const [isSpinning, setSpinning] = useState()
  const lpContract = useContract(LP_ADDRESS, LP_ABI)
  const aTokenContract = useContract(ATOKEN1800_ADDRESS, ERC20_ABI)
  const tokenContract = useContract(TOKEN1800_ADDRESS, TR_ABI)

  useEffect(()=>{
    const getData = async () => {
      setAToken1800(ethers.utils.formatUnits(await aTokenContract.balanceOf(account), 18));
      setToken1800(ethers.utils.formatUnits(await tokenContract.balanceOf(account), 18));
    }
    if(lpContract && aTokenContract && tokenContract) getData()
  }, [token1800, lpContract, aTokenContract, tokenContract])
  
  const withdrawLP = async () => {
    console.log('withdraw from lp');
    await lpContract.withdraw(TOKEN1800_ADDRESS, ethers.constants.MaxUint256, account);
  }
  
  const withdrawTicker = async () => {
    console.log('withdraw from ticker');
    let am = ethers.utils.parseUnits(token1800, 18)
    await tokenContract.withdraw(am, 0, 0);
  }

  return (<div style={{ minWidth: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography.Title>Withdraw from ETH-1800</Typography.Title>
    <Row style={{ width: 1200}} gutter={24}>
      <Col md={12}>
        <Card title="Bug resolution">
          <h3>Withdraw ETH-1800 asset from Lending Pool</h3>
          <span>ETH-1800 balance in LP: {aToken1800}</span><br/>
          <Button onClick={withdrawLP}>Withdraw</Button>
          <h3>Remove ETH+USDC from Ticker-ETH-1800</h3>
          <span>T-ETH-1800 balance: {token1800}</span><br/>
          <Button onClick={withdrawTicker}>Withdraw ETH+UDSC</Button>
        </Card>

      </Col>
    </Row>
  </div>);
}

export default Bug0x4;