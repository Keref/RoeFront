import { useWeb3React } from "@web3-react/core";
import { useState, useEffect } from 'react';
import { Col, Row, Button, Card, Input, Slider, Typography, Spin, Tooltip, Divider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import Link from "next/link";
import { useRouter } from 'next/router';
import LendingPoolTable from "../components/lendingPoolTable";
import DepositNoLevModal from "../components/depositNoLevModal"
import Chart from '../components/perps/chart'
import CdsPositionRow from '../components/cdsPositionRow'

import useUnderlyingAmount from "../hooks/useUnderlyingAmount";
import useAddresses from "../hooks/useAddresses";
import useAssetData from "../hooks/useAssetData";
import getUserLendingPoolData from "../hooks/getUserLendingPoolData";
import useLendingPoolContract from "../hooks/useLendingPoolContract";
import {ethers} from "ethers";

function CDS() {
  const { account } = useWeb3React();
  const router = useRouter()
  let { vault, asset} = router.query
  let lpAddress = vault;

  const [price, setPrice] = useState(0)
  const [selectedRange, selectRange] = useState(0);
  const [ranges, setRanges] = useState([])
  const [inputValue, setInputValue] = useState(0)
  const [leverage, setLeverage] = useState(1);
  const [percentDebt, setPercentDebt] = useState(90);
  const [isSpinning, setSpinning] = useState(false);
  const onChangeLeverage = (newVal) => { setLeverage(newVal) }

  const vaultAddresses = useAddresses(lpAddress)
  const lendingPool = vaultAddresses['lendingPools'].length > 0 ?  vaultAddresses['lendingPools'][0] : {}
  const rangeAddresses = lendingPool['lpToken'] ? [ lendingPool['lpToken'] ] : []
  for (let p in lendingPool.ranges) rangeAddresses.push(lendingPool.ranges[p])

  var token0 = useAssetData(lendingPool.token0 ? lendingPool.token0.address : null, lpAddress)
  var token1 = useAssetData(lendingPool.token1 ? lendingPool.token1.address : null, lpAddress)
  var cdsAsset = useAssetData( asset, lpAddress )
  console.log('cdsaw', cdsAsset)
  var lpContract = useLendingPoolContract(lpAddress)

  var assets = [
    { key: 0, ...token0 },
    { key: 1, ...token1 },
  ];
  
  // Token amounts: if v3, use values from the TR smart contract - useCLPValues return $1 worth of tokens
  const tokenAmounts = useUnderlyingAmount(ranges.length > 0 ? ranges[selectedRange].address : null, lendingPool )
  
  const userAccountData = getUserLendingPoolData(lpAddress) 
  var healthFactor = ethers.utils.formatUnits(userAccountData.healthFactor ?? 0, 18)
  var availableCollateral = ethers.utils.formatUnits(userAccountData.availableBorrowsETH ?? 0, 8)

  // Farm position
  const farm = async () => {
    const abi = ethers.utils.defaultAbiCoder;
    const POOL_ID = lendingPool.poolId;
    const farmMode = (selectedRange == 0? 1 : 0); // Full range UNIv2: mode 1, UNIv3-TokenisableRange mode 0
    let params = abi.encode(["uint", "uint8", "address", "address"], [POOL_ID, farmMode, account, rangeAddresses[selectedRange].address ]);
    try {
      //console.log('flashhh', vaultAddresses["rangerPositionManager"], [token0.address, token1.address], amounts, [2, 2], account, params, 0 )
    // flashloan( receiver, tokens, amounts, modes[2 for open debt], onBehalfOf, calldata params, refcode)
    let res = await lpContract.flashLoan(vaultAddresses["rangerPositionManager"], [token0.address, token1.address], amounts, [2, 2], account, params, 0)
    } catch(e) {console.log('farm error', e)}
  }

  // rebalance no leverage inputs based on asset ratio and user input
  const setNoLevValues = (val) => {
    if ( val.asset0 == 0 || val.asset1 == 0 ) return setNoLevInputs([0,0])
    if (val.asset0 && tokenAmounts.amount0 > 0) return setNoLevInputs([val.asset0, tokenAmounts.amount1 * val.asset0 / tokenAmounts.amount0])
    if (val.asset1 && tokenAmounts.amount1 > 0) return setNoLevInputs([tokenAmounts.amount0 * val.asset1 / tokenAmounts.amount1, val.asset1])
  }

  const maxBorrow = Math.min(
    cdsAsset.tlv, // min (available, debt ceiling)
    availableCollateral * 0.9 / cdsAsset.oraclePrice
  )

  return (
    <div>
      <Typography.Title>
        Impermanent Gainooor: {token0.name}-{token1.name}
      </Typography.Title>

      <Row gutter={16} style={{marginTop: 16}}>
        <Col span={12} type="flex">
          <Typography.Title level={2}>Collateral</Typography.Title>
          
          <Typography.Paragraph>Base debt available: <span style={{ fontWeight: 'bold'}}>${availableCollateral} </span>
           - Health ratio: 
            <span style={{ color: (healthFactor > 1.01 ? "green" : (healthFactor > 1 ? "orange" : "red" ) ) }}>
              {healthFactor > 100 ? <span style={{fontSize: 'larger'}}> &infin; </span> : parseFloat(healthFactor).toFixed(3)}
            </span>&nbsp;    
            <Tooltip placement="right" title="Keep your health factor above 1.01 to avoid liquidations"><QuestionCircleOutlined /></Tooltip>
          </Typography.Paragraph>
          <LendingPoolTable assets={assets} lendingPool={lendingPool} isMinimal={true}/>
        </Col>
        
        <Col span={12} type="flex">
          <Typography.Title level={2}>Open an IG position</Typography.Title>
          <Typography.Paragraph>Be exposed to price moves in either direction, with pay-as-you-go funding.</Typography.Paragraph>
          <Card bordered={false} style={{ }} bodyStyle={{height: '100%'}}>
            <div style={{}}>
              <span>{cdsAsset.name}<span onClick={()=>{setInputValue(maxBorrow)}} style={{ float: 'right', fontSize: 'smaller'}}>Max: {maxBorrow}</span></span>
              <Input value={inputValue} style={{ marginBottom: 12 }} 
                onChange={(e)=> setInputValue(e.target.value)}
              />
              <span>Position value: ${(inputValue * cdsAsset.oraclePrice).toFixed(2)}</span><br/>

              <Button type='primary' disabled={availableCollateral < 1} style={{ marginTop:16}}>
                {availableCollateral<1 ? <>Add more collateral</>: <>Open Position</>}
              </Button>
              <Divider />
              
              <span>Available for borrow: ${(cdsAsset.tlv * cdsAsset.oraclePrice).toFixed(2)}</span><br/>
              <span>Funding rate: ${cdsAsset.debtApr}</span>
            </div>
          </Card>
        </Col>

        <Col span={24} type="flex">
          <Typography.Title level={2}>Positions</Typography.Title>
          <Card title="Positions">
          <table>
            <thead><tr>
              <th align='left'>Asset</th>
              <th align='left'>Amount</th>
              <th align='right'>Funding <Tooltip placement="right" title="Hourly funding rate"><QuestionCircleOutlined /></Tooltip></th>
              <th align='right'>PnL</th>
            </tr></thead>
            <tbody>
              {
                lendingPool['lpToken'] && <CdsPositionRow asset={lendingPool['lpToken'].address} vault={lendingPool} />
              }
              {
                lendingPool['ranges'] && lendingPool['ranges'].length > 0 &&
                lendingPool['ranges'].map( range => <CdsPositionRow key={range.address} assetAddress={range.address} vault={lendingPool} /> )
              }
            </tbody>
          </table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default CDS;

