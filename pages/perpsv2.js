import { useEffect, useState } from "react";
import { Col, Row, Button, Card, Input, Typography, Spin, Divider } from "antd";

import VaultPerpsFormV2 from "../components/perps/vaultPerpsFormV2";
import Positions from "../components/perps/positions";
import Infobar from "../components/perps/infobar";
import Chart from "../components/perps/chart";
import TradingViewWidget from "../components/perps/tv";
import useAddresses from "../hooks/useAddresses";
import useUniswapPrice from "../hooks/useUniswapPrice";
import usePositionsHistory from "../hooks/usePositionsHistory";
import useTheme from "../hooks/useTheme";
import { useWeb3React } from "@web3-react/core";

// Display all user assets and positions in all ROE LPs
const PerpsV2 = () => {
  const { account} = useWeb3React();
  const theme = useTheme()
  // only works for ARB in testing no other vault
  const [currentVault, selectVault] = useState(1);
  const [positions, setPositions] = useState([]);
  const [interval, setInterval] = useState("1h");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const ADDRESSES = useAddresses();
  const history = usePositionsHistory(account, refreshCounter);
  const gap = 12;
  let vaults = ADDRESSES["lendingPools"];

  let intervalBybit = interval;
  if (interval == "15m") intervalBybit = "15";
  else if (interval == "1h") intervalBybit = "60";
  else if (interval == "4h") intervalBybit = "240";
  else if (interval == "1d") intervalBybit = "D";

  let price = useUniswapPrice(
    vaults[currentVault].uniswapPool,
    vaults[currentVault].token0.decimals - vaults[currentVault].token1.decimals
  );

  const checkPositions = () => {
    setRefreshCounter(refreshCounter+1)
    const positionsData = JSON.parse( localStorage.getItem("GEpositions") ?? '{}' );
    if ( positionsData && positionsData[account] ) {
      let pos = [];
      for(let k of Object.keys(positionsData[account]['opened']) )
        pos.push(positionsData[account]['opened'][k])
      setPositions(pos)
    }
  }

  useEffect( () => {
    checkPositions()
  }, [account])
  

  return (
    <div style={{ minWidth: 1400, display: "flex", flexDirection: "row" }}>
      <div style={{ width: 1043 }}>
        <Card style={{ marginBottom: gap }} bodyStyle={{ padding: 8 }}>
          <Infobar
            vaults={vaults}
            current={currentVault}
            selectVault={selectVault}
            price={price}
          />
        </Card>
        <TradingViewWidget
          positions={positions}
          symbol={vaults[currentVault].tvSymbol}
        />
        <Positions vaults={vaults} vault={vaults[currentVault]} positions={positions} checkPositions={checkPositions} price={price} refresh={refreshCounter} />
      </div>
      <div style={{ width: 343, marginLeft: gap}}>
        <VaultPerpsFormV2
          vault={vaults[currentVault]}
          price={price}
          strikeManagerAddress={ADDRESSES["strikeManager"]}
        />
      </div>
    </div>
  );
};

export default PerpsV2;