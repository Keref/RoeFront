import { useState, useEffect } from "react";
import { useRouter } from 'next/router'
import { usePathname } from 'next/navigation'
import { Button, Card, Row, Col, Divider, Typography, Input } from "antd";
import useReferrals from "../hooks/useReferrals";
import REFERRALS_ABI from "../contracts/Referrals.json";
import {ethers} from 'ethers'
import { useWeb3React } from "@web3-react/core";
import { useTxNotification } from "../hooks/useTxNotification";


const Referrals = () => {
  const router = useRouter()
  const [refName, setReferrerName] = useState(router.query.ref)
  const [myName, setMyName] = useState(router.query.ref)
  const [refresh, setRefresh] = useState(0)
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
    
  let referralDetails = useReferrals(refresh);
  const rname = (!referralDetails.name || referralDetails.name == "0x0000000000000000000000000000000000000000000000000000000000000000") 
    ? "" 
    : ethers.utils.parseBytes32String(referralDetails.name)  
  const referrerName = (!referralDetails.referrerName || referralDetails.referrerName == "0x0000000000000000000000000000000000000000000000000000000000000000") 
    ? "" 
    : ethers.utils.parseBytes32String(referralDetails.referrerName)
  
  
  const registerName = async () => {
    try {
      const res = await referralDetails.contract.registerName(ethers.utils.formatBytes32String(myName));
      setRefresh(refresh+1)
      showSuccessNotification(
        "Referral Name Set",
        "Referral Name Set Successfully",
        hash
      );
    } catch (e) { 
      console.log("Regidter ref name", e);      
      showErrorNotification(e.code, e.reason);
    }
  }
  
  const registerReferrer = async () => {
    console.log('sdf' ,refName)
    try {
      const res = await referralDetails.contract.registerReferrer(ethers.utils.formatBytes32String(refName));
      setRefresh(refresh+1)
      showSuccessNotification(
        "Referrer Set",
        "Referrer Set Successfully",
        hash
      );
    } catch (e) { 
      console.log("Register referrer name", e) 
      showErrorNotification(e.code, e.reason);
    }
  }
  
  
  
  return <div style={{ width: 1400 }}>
    {contextHolder}
    <Typography.Title>Good <span style={{ color: "#0ffd6a"}}>Referral</span></Typography.Title>
    <Typography>Earn a share of fees with Good Entry <a href="#">Referral Program</a></Typography>
    
    <Row gutter={12} style={{ marginTop: 12}}>
      <Col span={12}>
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Card style={{ textAlign: 'center'}}>
              Total Referrals<br/>
              <span style={{ color: "white", fontSize: "2em"}}>{referralDetails.referreesLength?.toString()}</span>
            </Card>
          </Col>
        </Row>
        <Card title="REFERRER">
          <Row gutter={[12,12]}>
            <Col span={4} style={{textAlign: "right", color: "white", paddingTop: 4, fontWeight: 600}}>My Referrer</Col>
            <Col span={20}>
              <Row>
                <Col span={24}>
                  {!referrerName ? 
                      <Input.Search 
                        enterButton="Set Referrer"
                        onChange={(e) => setReferrerName(e.target.value)}
                        onSearch={registerReferrer}
                      />
                    : <Input defaultValue={referrerName} suffix="O" />
                  }
                </Col>
              </Row>
            </Col>
            <Col span={4} style={{textAlign: "right", color: "white", paddingTop: 4, fontWeight: 600}}>Ref Code</Col>
            <Col span={20}>
              <Row>
                <Col span={24}>
                  {!rname ? 
                      <Input.Search 
                        enterButton="Register Name"
                        onChange={(e) => setMyName(e.target.value)}
                        onSearch={registerName}
                      />
                    : <Input value={rname} />
                  }
                </Col>
              </Row>
            </Col>
            <Col span={4} style={{textAlign: "right", color: "white", paddingTop: 4, fontWeight: 600}}>Ref Link</Col>
            <Col span={20}><Input value={"https://degen.goodentry.io/referrals/?ref="+rname} /></Col>
          </Row>
        </Card>
      </Col>
      <Col span={12}>
        <Card title="AFFILIATES HISTORY">
        <table>
          <thead>
            <tr>
              <th align="left">Tx</th><th align="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {
              referralDetails.fees.map(tx => {
                return (<tr key={tx.transactionHash}>
                    <td>
                      <a href={"https://arbiscan.io/tx/"+tx.transactionHash} target="_blank" rel="noreferrer" >
                        {tx.transactionHash.substring(0,20)}...
                      </a>
                    </td>
                    <td align="right" style={{color: "white", fontWeight: 600}}>
                      {(tx.amount / 1e6).toFixed(4)} {tx.token="0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" ? "USDC.e" : "USDC"}
                    </td>
                  </tr>)
              })
            }
          </tbody>
        </table>
        </Card>
      </Col>
    </Row>
  </div>
}

export default Referrals;