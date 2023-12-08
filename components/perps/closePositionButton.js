import { useState } from "react";
import { Button, Spin } from "antd";
import GEPM_ABI from "../../contracts/GoodEntryPositionManager.json";
import useContract from "../../hooks/useContract";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useTxNotification } from "../../hooks/useTxNotification";

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const ClosePositionButton = ({ vault, position, setRefresh }) => {
  const { account } = useWeb3React();
  const [isSpinning, setSpinning] = useState(false);
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
  const opmContract = useContract(vault.positionManagerV2, GEPM_ABI);

  const closePosition = async () => {
    setSpinning(true);
    try {
      const { hash } = await opmContract.closePosition(position.positionId);
      showSuccessNotification(
        "Position closed",
        "Position closed successful",
        hash
      );
      await sleep(2000)
      console.log('gotta resf')
      setRefresh(new Date().getTime())
    } catch (e) {
      console.log("Error closing position", e);
      showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  };

  return (
    <>
      {contextHolder}
      {isSpinning ? (
        <Spin />
      ) : (
        <Button size="small" onClick={closePosition}>
          Close
        </Button>
      )}
    </>
  );
};

export default ClosePositionButton;
