import { Button } from 'antd'
import useAssetData from '../hooks/useAssetData'
import CloseLonggPositionButton from './closeLonggPositionButton'


const CdsPositionRow = ({vault, assetAddress}) => {
  const asset = useAssetData(assetAddress)

  if ( asset.debt == 0) return <></>
  
  return (<>
    <tr>
      <td>{asset.name}</td>
      <td>{asset.debt}</td>
      <td>{asset.oraclePrice * asset.debt}</td>
      <td>0</td>
      <td>0</td>
      <td><CloseLonggPositionButton address={assetAddress} vault={vault} /></td>
    </tr>
  </>)
}


export default CdsPositionRow;