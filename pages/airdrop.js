import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Input, Button, Progress, Spin } from 'antd';
import { ethers } from "ethers";
import AIRDROP_ABI from "../contracts/GoodAirdrop.json";
import useContract from "../hooks/useContract";
import { useWeb3React } from "@web3-react/core";
import axios from 'axios'; 


function Airdrop() {
  const { account, library } = useWeb3React();
  const [airdropAmount, setAirdropAmount] = useState()
  const [airdropProof, setAirdropProof] = useState()
  var AIRDROP_ADDRESS  = "0x5c09C0194FC89CcDAe753f348D1534108F29e90a"; // dummy, not deployed yet
  const PROOFS_URL = "https://roe.nicodeva.xyz/stats/arbitrum/proofs.json"

  const airdropContract = useContract(AIRDROP_ADDRESS, AIRDROP_ABI)

  useEffect(()=>{
    const getAirdropData = async () => {
      const rdata = (await axios.get(PROOFS_URL)).data;
      if (rdata.hasOwnProperty(account)){
        setAirdropAmount(rdata[account].amount)
        setAirdropProof(rdata[account].proof)
      }
    }
    if(account && airdropContract) getAirdropData()
  }, [account, airdropContract])


  const claim = async () => {
    console.log('claim airdrop');
    await airdropContract.claim(airdropProof, airdropAmount);
  }


  return (<div style={{ minWidth: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography.Title>Airdrop Claims</Typography.Title>
    <Row style={{ width: 1200}} gutter={24}>
      <Col md={12}>
        <Card title="Mucho airdrop esGOOD!">
          <h3>User {account} airdrop: {airdropAmount}</h3><br/>
          <Button onClick={claim}>Claim</Button>
        </Card>

      </Col>
    </Row>
  </div>);
}

export default Airdrop;