import usePositionsHistory from "../../hooks/usePositionsHistory";
import HistoryTx from "./historyTx";

const PositionsHistory = ({ account, vault, refresh }) => {
  
  const thStyle = {
    color: "#94A3B8",
    fontWeight: 500,
    textDecorationStyle: "dotted",
    textDecorationStyle: 'dotted', 
    textDecorationColor: 'grey',
    textDecorationLine: 'underline'
  }
  
  const history = usePositionsHistory(account, vault, refresh);

  return (<>
        {
          history ? [...history].reverse().map( tx => {
            return (<HistoryTx key={tx.hash} tx={tx} vault={vault} />);
          }) : <></>
        }
  </>)
}

export default PositionsHistory;