import useTheme from "../../hooks/useTheme";

const VaultPerpsStrikes = ({ asset, onClick, isSelected }) => {
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

  return (
    <div
      onClick={() => {
        onClick({ price: asset.price, address: asset.address, fundingRate: fundingRate.toFixed(4) });
      }}
      style={style}
    >
      {asset.price}
      {/*<span>{parseFloat(asset.tvl).toFixed(0)}</span>*/}
      <span style={{ float: "right" }}>
        {fundingRate.toFixed(4)}%
      </span>
    </div>
  );
};

export default VaultPerpsStrikes;
