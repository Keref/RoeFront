import { useState, useEffect } from "react";
import { Button, Input, Spin, Slider, Card, Modal, Popover } from "antd";
import { RiseOutlined, FallOutlined, QuestionCircleOutlined} from "@ant-design/icons";

import GEPM_ABI from "../../contracts/GoodEntryPositionManager.json";
import GEV_ABI from "../../contracts/GoodEntryVault.json";
import ERC20_ABI from "../../contracts/ERC20.json";
import ORACLE_ABI from "../../contracts/GoodEntryOracle.json";
import StrikeManager_ABI from "../../contracts/StrikeManager.json";
import useContract from "../../hooks/useContract";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useTxNotification } from "../../hooks/useTxNotification";


const VaultPerpsFormV2 = ({ vault, price, strikeManagerAddress }) => {
  // Note: all addresses.json will be revamped, esp. can replcae token0/token1 by baseToken/quoteToken so easier to quesry and display
  const { account, library } = useWeb3React();
  const [isSpinning, setSpinning] = useState()
  const [quoteBalance, setQuoteBalance] = useState(0)
  const [strikeX8, setStrike] = useState(ethers.constants.Zero);
  const [direction, setDirection] = useState("Long");
  let isCall = direction == "Long";
  
  const [fundingRate, setFundingRate] = useState(0);
  // can request minPositionValueX8 from contract but it's fixed at $50 and wont likely change
  const [minPositionValue, setMinPositionValue] = useState(50);
  const minCollateralAmount = 1; // fixed in contract, min collateral $1

  const [positionSize, setpositionSize] = useState("0");
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
  const pmContract = useContract(vault.positionManagerV2, GEPM_ABI);

  const vaultContract = useContract(vault.vaultV2, GEV_ABI);
  const quoteContract = useContract(vault.quoteToken.address, ERC20_ABI)
  const strikeContract = useContract(strikeManagerAddress, StrikeManager_ABI)
  const oracleContract = useContract("0x2ce8FdFA67c78D1c313449819603AA52d3d2CC41", ORACLE_ABI);
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  
  // Get user's USDC balance
  useEffect(() => {
    const getData = async () => {
      setQuoteBalance(await quoteContract.balanceOf(account)); 
    }
    if (account && vaultContract && quoteContract) getData();
  }, [account, vaultContract, quoteContract])

  // Get closest strike based on current pair price
  useEffect(() => {
    const getData = async () => {
      let valStrike = 
        direction == "Long" ? 
          await strikeContract.getStrikeAbove(parseInt(price * 1e8))
          : await strikeContract.getStrikeBelow(parseInt(price * 1e8))
      setStrike(valStrike);
    }  
    if (price > 0 && strikeContract) getData();
  }, [price, strikeContract, direction])
  
  // Compute funding rate based on current input parameters
  useEffect(() => {
    const getData = async () => {
      // position size in quote tokens on UX, but the contract needs size in base token for longs, and quote tokens for shorts
      let notionalAmount = 
        isCall ? 
          ethers.utils.parseUnits((positionSize / price).toString(), vault.baseToken.decimals) 
          : ethers.utils.parseUnits(positionSize, vault.quoteToken.decimals);
      // the price is per unit, not for the whole notionalAmount. used to estimate utilizationRate accurately (higher utilization rate will push option price up)
      // function getOptionPrice(bool isCall, uint strike, uint size, uint timeToExpirySec) public view returns (uint optionPriceX8);
      const optionPriceX8 = await pmContract.getOptionPrice(
        isCall, 
        strikeX8.toString(), 
        notionalAmount,
        21600 // 6h, time for streaming options
      );
      // optionPriceX8 is the price of 1 call or 1 put on the base, for 6h, so hourly funding in % is 100 * price / 6h
      setFundingRate(100 * optionPriceX8 / 6 / 1e8);
    }
    if (price > 0) getData()
  }, [positionSize, price,  isCall, pmContract, strikeX8, vault.baseToken.decimals, vault.quoteToken.decimals])


  const openPosition = async () => {
    setSpinning(true)
    try {
      // position size in quote tokens on UX, but the contract needs size in base token for longs, and quote tokens for shorts
      let notionalAmount = 
        isCall ? 
          ethers.utils.parseUnits((positionSize / price).toString(), vault.baseToken.decimals) 
          : ethers.utils.parseUnits(positionSize, vault.quoteToken.decimals);
      let collateralAmountAdj = ethers.utils.parseUnits(collateralAmount, vault.quoteToken.decimals);
      // check allowance // dirty add the 4e6 fixed exercise fee
      let result = await quoteContract.allowance(account, vault.positionManagerV2);
      if ( result.lt(collateralAmountAdj + 4e6)) {
        result = await quoteContract.approve(vault.positionManagerV2, ethers.constants.MaxUint256);
        await delay(6000);
      }
      
      // function openStreamingPosition(bool isCall, uint notionalAmount, uint collateralAmount) external returns (uint tokenId)
      const { hash } = await pmContract.openStreamingPosition(isCall, notionalAmount, collateralAmountAdj);

      showSuccessNotification(
        "Position opened",
        "Position opened successful",
        hash
      );
    } catch (e) {
      console.log(e);
      showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  };


  let positionBelowMin = minPositionValue > positionSize
  let collateralBelowMin = minCollateralAmount > collateralAmount
  const isOpenPositionButtonDisabled = parseFloat(positionSize) == 0 || positionBelowMin || collateralBelowMin;

  let openPositionButtonErrorTitle = "Open " + direction;
  if (parseFloat(collateralAmount) > 0 && parseFloat(positionSize) > 0){
    if (positionBelowMin) openPositionButtonErrorTitle = "Position size too Low";
    else if (collateralBelowMin) openPositionButtonErrorTitle = "Collateral amount too Low";
  }
  
  // runway: hourly funding funding * size = hourly cost, runway in hours = collateral amount / hourly cost
  let hourlyCost = fundingRate * positionSize
  let runway = hourlyCost == 0 ? 0 : parseFloat(collateralAmount) / (fundingRate * positionSize)
  let runwayHours = Math.floor(runway)
  let runwayMinutes = Math.floor((runway - runwayHours) * 60);
  
  return (
  <>
    <Card style={{ marginBottom: 8, color: 'white' }}>
      <div>
        {contextHolder}
        <Button
          type={direction == "Long" ? "primary" : "default"}
          style={{ width: "50%", textAlign: "center", borderRadius: "4px 0 0 4px" }}
          icon={<RiseOutlined style={{marginRight: 8}}/>}
          onClick={() => {
            setDirection("Long");
          }}
        >
          <strong>Long</strong>
        </Button>
        <Button
          type={direction == "Short" ? "primary" : "default"}
          style={{ width: "50%", textAlign: "center", borderRadius: "0 4px 4px 0" }}
          icon={<FallOutlined style={{marginRight: 8}} />}
          onClick={() => {
            setDirection("Short");
          }}
          danger={direction == "Short"}
        >
          <strong>Short</strong>
        </Button>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 24,
          }}
        >
          <div>
            Activation Price
            <span style={{ float: "right" }}>
              Funding / 1h{" "}
              <Popover
                placement="top"
                title="Estimated Hourly Funding"
                style={{ border: "1px solid blue"}}
                content={
                  <div style={{ width: 250 }}>Funding is the borrowing interest rate.</div>
                }
              >
                <QuestionCircleOutlined />
              </Popover>
            </span>
          </div>
          <div style={{borderRadius: 4, backgroundColor: "#1D2329", padding: 8, marginBottom: 4 }}>
            {(strikeX8/1e8).toString()}
            <span style={{ float: "right"}}>{fundingRate.toFixed(4)}</span>
          </div>

          Position Size
          <Input
            placeholder="Amount"
            suffix="USDC"
            onChange={(e) => setpositionSize(e.target.value)}
            key="inputamount"
            value={positionSize}
          />
          <div>
            Collateral
            <span style={{ float: "right" }}>
              Leverage: {parseFloat(collateralAmount) > 0 ? (positionSize / collateralAmount).toFixed(0)+"x" : <>&infin;</>}{" "}
              <Popover
                placement="top"
                title="Leverage - Collateral"
                style={{ border: "1px solid blue"}}
                content={
                  <div style={{ width: 250 }}>Collateral determines how long the position can be kept open. You are liquidited by time, not by price movement.<br/>There is also a flat $4 reserved exercised fee. It is returned to you if you close your position on time.<br/>If collateral runs out and a 3rd party closes the position, then that fee is split in half between that 3rd party and the protocol.
                  <br/>Leverage is the effective position size vs the amount of collateral provided. Be careful, high leverage means short term positions!
                  </div>
                }
              >
                <QuestionCircleOutlined />
              </Popover>
            </span>
            <Input
              style={{marginTop: 8}}
              placeholder="Amount"
              suffix="USDC"
              onChange={(e) => setCollateralAmount(e.target.value)}
              key="collateralAmount"
              value={collateralAmount}
            />
          </div>
        </div>
      </div>
    </Card>
    <Card>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Market</span>
        <span style={{fontSize: "small"}}>{vault.name}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Side</span>
        <span style={{ fontSize: "small" }}>{direction}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Size</span>
        <span style={{ fontSize: "small"}}>$ {positionSize}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Activation Price</span>
        <span style={{ fontSize: "small"}}>$ {(strikeX8/1e8).toString()}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Collateral (funding + fixed fee)</span>
        <span style={{ fontSize: "small"}}>$ {parseFloat(collateralAmount) + 4}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Current Hourly Rate</span>
        <span style={{ fontSize: "small"}}>{fundingRate.toFixed(5)}%</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Runway</span>
        <span style={{ fontSize: "small"}}>{runwayHours} h {runwayMinutes} min</span>
      </div>

      <Button
        type="default"
        onClick={openPosition}
        disabled={isOpenPositionButtonDisabled}
        danger={direction == "Short"}
        style={{ width: "100%", marginTop: 8 }}
      >
        {isSpinning ? 
          <Spin /> 
          : isOpenPositionButtonDisabled ? openPositionButtonErrorTitle : "Open " + direction
        }
      </Button>
    </Card>
  </>
  );
};

export default VaultPerpsFormV2;