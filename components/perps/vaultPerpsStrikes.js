import { useState } from "react";
import useTheme from "../../hooks/useTheme";
import { Modal } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const VaultPerpsStrikes = ({ asset, onClick, isSelected }) => {
  const [isVisible, setVisible] = useState()
  const theme = useTheme();

  var style = {
    cursor: "pointer",
    borderRadius: 4,
    backgroundColor: "#1D2329",
    padding: 8,
    marginBottom: 4
  };
  if (isSelected)
    style = {
      //backgroundColor: 'rgba(255,255,255,0.2',
      border: "1px solid " + theme.colorPrimary,
      ...style,
    };
  const fundingRate = (asset.debtApr+asset.feeApr) / 365 / 24;
  
  const openStrikeStats = async () => {
    setVisible(true)
    // download latest stats from Revert and last day stats from GE data
    
    
  }

  return (
    <>
      <Modal title="Basic Modal" open={isVisible} onOk={()=>{setVisible(false)}} onCancel={()=>{setVisible(false)}}>
        {asset.tokenId}
      </Modal>
      <div
        onClick={() => {
          onClick({ price: asset.price, address: asset.address, fundingRate: fundingRate.toFixed(4) });
        }}
        style={style}
      >
        {asset.price}
        {/*<span>{parseFloat(asset.tvl).toFixed(0)}</span>*/}
        <span style={{ float: "right", marginLeft: 8 }} onClick={()=>{setVisible(true)}}>
          <QuestionCircleOutlined />
        </span>
        <span style={{ float: "right" }}>
          {fundingRate.toFixed(4)}%
        </span>
      </div>
    </>
  );
};

export default VaultPerpsStrikes;
