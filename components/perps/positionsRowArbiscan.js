import { useEffect } from "react";
import useAssetData from "../../hooks/useAssetData";
import useUnderlyingAmount from "../../hooks/useUnderlyingAmount";
import CloseTrPositionButton from "../closeTrPositionButton";
import useAddresses from "../../hooks/useAddresses";
import usePerpsEventLogsV2 from "../../hooks/usePerpsEventLogsV2";
import { Space } from "antd";
import { CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";

const PositionsRowArbiscan = ({ address, vault, price, checkPositions }) => {
  const asset = useAssetData(address, vault.address);
  const token0 = useAssetData(vault.token0.address, vault.address);
  const token1 = useAssetData(vault.token1.address, vault.address);
  const { tokenAmounts, tokenAmountsExcludingFees, totalSupply } =
    useUnderlyingAmount(address, vault);

  // avoid spamming arbiscan by providing a valid address only when the debt is non null, rate limit is 5 req/s
  const posEvent = usePerpsEventLogsV2(address, vault.address, asset.debt);

  if (asset.debt == 0) return <></>;

  let amount0 = (tokenAmounts.amount0 * asset.debt * 1e18) / totalSupply;
  let amount1 = (tokenAmounts.amount1 * asset.debt * 1e18) / totalSupply;
  let amount0EF =
    (tokenAmountsExcludingFees.amount0 * asset.debt * 1e18) / totalSupply;
  let amount1EF =
    (tokenAmountsExcludingFees.amount1 * asset.debt * 1e18) / totalSupply;

  // PnL is value of the tokens withdrawn when opening the position (whether swapped or not) minus the value of debt now
  let pnl = 0;
  let pnlPercent = 0;
  let direction = "-";
  let entry = 0;

  if (posEvent) {
    let costDebt = amount0 * token0.oraclePrice + amount1 * token1.oraclePrice;
    pnl =
      (posEvent.token0Amount * token0.oraclePrice) / 10 ** token0.decimals +
      (posEvent.token1Amount * token1.oraclePrice) / 10 ** token1.decimals -
      costDebt;
    pnlPercent = (100 * pnl) / costDebt;
    //position direction: if token0 value > token1 on open, then we're exposed to it, its long
    if (
      (posEvent.token0Amount * token0.oraclePrice) / 10 ** token0.decimals <
      (posEvent.token1Amount * token1.oraclePrice) / 10 ** token1.decimals
    ) {
      direction = "Short";
    } else {
      direction = "Long";
    }
    // from the event we have received X usdc + Y weth = assetValue => entry = ( assetValue -  X ) / Y
    if (posEvent.token0Amount > 0)
      entry =
        ((posEvent.assetValue - posEvent.token1Amount / 10 ** token1.decimals) /
          posEvent.token0Amount) *
        10 ** token0.decimals;
  }

  const tdStyle = { paddingTop: 4, paddingBottom: 4 };

  return (
    <tr key={asset.address}>
      <td style={{...tdStyle, paddingLeft: 0}}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={token0.icon}
            alt={token0.name}
            height={20}
            style={{ marginRight: 8 }}
          />
          {token0.name} {asset.price}
        </div>
      </td>
      <td style={tdStyle}>
        <span
          style={{
            color: direction == "Long" ? "#55d17c" : "#e57673",
            fontWeight: "bold",
            fontSize: "smaller",
          }}
        >
          {direction.toUpperCase()}
        </span>
      </td>
      <td style={tdStyle}>
        {amount0EF > 0 && (
          <>
            <span style={{fontWeight: 500 }}>{amount0EF.toFixed(5)} {vault.token0.name}</span>
            <br />
            <span style={{ color: 'grey' }}>${(token0.oraclePrice * amount0EF).toFixed(2)}</span>
          </>
        )}
        {amount1EF > 0 && (
          <>
            {amount1EF.toFixed(2)} {vault.token1.name}
            <br />
            <span style={{ color: 'grey' }}>${(token0.oraclePrice * amount0EF).toFixed(2)}</span>
          </>
        )}
      </td>
      <td style={tdStyle}>
        {(asset.debtApr / 365 / 24).toFixed(4)}%
      </td>
      <td style={tdStyle}>${entry.toFixed(2)}</td>
      <td style={tdStyle}>

          <span style={{ color: pnl > 0 ? "#55d17c" : "#e57673" }}>
            {pnl > 0 ? <CaretUpOutlined /> : <CaretDownOutlined />}
            {pnlPercent.toFixed(2)}%
          </span>
          <br />
          {" "}${(isNaN(pnl) ? 0 : pnl).toFixed(3)}

      </td>
      <td style={tdStyle}>
        <CloseTrPositionButton address={address} vault={vault} checkPositions={checkPositions} />
      </td>
    </tr>
  );
};

export default PositionsRowArbiscan;