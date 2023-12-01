import { useEffect, useState } from "react";
import { Col, Row, Button, Card, Input, Typography, Spin, Tabs, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

import VaultPerpsFormV2 from "../components/perps/vaultPerpsFormV2";
import Positions from "../components/perps/positions";
import PositionsHistory from "../components/perps/positionsHistory"
import Infobar from "../components/perps/infobar";
import Chart from "../components/perps/chart";
import TradingViewWidget from "../components/perps/tv";
import useAddresses from "../hooks/useAddresses";
import useOraclePrice from "../hooks/useOraclePrice";
import useTheme from "../hooks/useTheme";
import { useWeb3React } from "@web3-react/core";

// Display all user assets and positions in all ROE LPs
const PerpsV2 = () => {
  const { account} = useWeb3React();
  const theme = useTheme()
  // only works for ARB in testing no other vault
  const [currentVault, selectVault] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const ADDRESSES = useAddresses();
  const gap = 12;
  let vaults = ADDRESSES["lendingPools"];
  const thStyle = {
    color: "#94A3B8",
    fontWeight: 500,
    textDecorationStyle: "dotted",
    textDecorationStyle: 'dotted', 
    textDecorationColor: 'grey',
    textDecorationLine: 'underline'
  }

  let price = useOraclePrice(vaults[currentVault]);

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
          symbol={vaults[currentVault].tvSymbol}
        />
        <Card style={{ marginTop: 8 }}>
          <Tabs
            defaultActiveKey="Positions"

            items={[
              {
                label: "Positions",
                key: "Positions",
                children: <>
                    <table border={0}>
                      <thead>
                        <tr>
                          <th align="left" style={{...thStyle, paddingLeft: 0}}>Instrument</th>
                          <th align="left" style={thStyle}>Side</th>
                          <th align="left" style={thStyle}>Size</th>
                          <th align="left" style={thStyle}>
                            Funding{" "}
                            <Tooltip placement="right" title="Hourly funding rate">
                              <QuestionCircleOutlined />
                            </Tooltip>
                          </th>
                          <th align="left" style={thStyle}>Entry Price</th>
                          <th align="left" style={thStyle}>PNL&nbsp;&nbsp;</th>
                          <th align="left" style={{...thStyle, paddingRight: 0}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          vaults.map( vault => {
                            return (
                              <Positions key={vault.address} vault={vault} />
                            )
                          })
                        }
                      </tbody>
                    </table>
                  </>
                },
                {
                  label: "History",
                  key: "History",
                  children: <table border={0}>
                      <thead>
                        <tr>
                          <th align="left" style={{...thStyle, paddingLeft: 0}}>Date</th>
                          <th align="left" style={thStyle}>Tx</th>
                          <th align="left" style={thStyle}>Instrument</th>
                          <th align="left" style={thStyle}>Strike</th>
                          <th align="left" style={thStyle}>Amount</th>
                          <th align="left" style={thStyle}>PNL&nbsp;&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          vaults.map( vault => {
                            return (
                              <PositionsHistory key={vault.address} account={account} vault={vault}/>
                            )
                          })
                        }
                      </tbody>
                    </table>
                },
              ]}
            />
        </Card>
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