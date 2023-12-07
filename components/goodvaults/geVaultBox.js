import { useState } from "react";
import { Card, Col, Popover, Divider } from "antd";
import { QuestionCircleOutlined, WarningOutlined } from "@ant-design/icons";
import Slider from "../design/slider";
import { useRouter } from 'next/router';
import useVaultV2 from "../../hooks/useVaultV2";
import useAssetData from "../../hooks/useAssetData";
import useTheme from "../../hooks/useTheme";

const GeVaultBox = ({vault}) => {
  const [highlightBox, setHighlightBox] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const vaultDetails = useVaultV2(vault);
  console.log('vaultDetails', vaultDetails)

  const toReadable = (value) => {
    if (value == 0) return 0;
    if (value < 10) return parseFloat(value).toFixed(2);
    if (value < 1000) return parseFloat(value).toFixed(0);
    if (value < 1e6) return (value / 1000).toFixed(0) + "k";
    if (value < 1e9) return (value / 1000).toFixed(0) + "M";
  };
  
  if (!vault || !vault.address ) return <></>  
  

  
  const filled = Math.round(100 * vaultDetails.tvl / vaultDetails.maxTvl);

  
  return (
    <Col
      md={6}
      xs={24}
      style={{ marginBottom: 24, cursor: "pointer" }}
      onMouseOver={() => {
        setHighlightBox(true);
      }}
      onMouseOut={() => {
        setHighlightBox(false);
      }}
      onClick={()=>{router.push("/vaults/"+vault.name)}}
    >
      <Card
        style= {{
          boxShadow: (highlightBox ? "0px 0px 30px rgba(15, 253, 106, 0.4)" : "" ) ,
          border: (highlightBox ? "1px solid #0FFD6A" : ""),
        }}
        bodyStyle= {{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between", height: '100%', gap: 12, 
        }}
      >
        <span
          style={{ fontSize: "x-large", marginLeft: 8 }}
        >
          {vaultDetails.name == "WETH-USDC" ? "ETH-USDC" : vaultDetails.name}
        </span>
        <img src={vaultDetails.icon} alt={vault.name.toLowerCase()} height={164} />
        
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: 'center'
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              Projected APR{" "}
                {/*<Popover
                placement="right"
                title="APR"
                content={
                  <div style={{ width: 250 }}>
                    Supply Interest:{" "}
                    <span style={{ float: "right" }}>{parseFloat(vaultDetails.supplyApr).toFixed(2)} %</span>
                    <br />
                    V3 Fees (7d annualized):{" "}
                    <span style={{ float: "right" }}>{parseFloat(vaultDetails.feeApr).toFixed(2)} %</span>
                    <br />
                    Token Incentives: <span style={{ float: "right" }}>{parseFloat(vaultDetails.airdropApr).toFixed(2)} %</span>
                  </div>
                }
              >
                <QuestionCircleOutlined />
                </Popover>*/}
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              {(parseFloat(vaultDetails.feeApr)).toFixed(2)} %
            </span>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              TVL
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.tvl)}
            </span>
        </div>
        <Slider value={filled} disabled={true} style={{marginTop: -12, marginBottom: -8}} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              Max. Capacity
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.maxTvl)}
            </span>
        </div>
        <Divider style={{margin: "12px 0"}} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              color: "grey",
            }}
          >
            My Assets
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.walletValue)}
            </span>
          </div>
        </div>
      </Card>
    </Col>
  )
}
  
export default GeVaultBox;