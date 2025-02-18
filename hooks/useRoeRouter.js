import ROE_ROUTER_ABI from "../contracts/RoeRouter.json";
import useContract from './useContract';
import useAddresses from './useAddresses';

export default function useRoeRouter(poolId) {
  const [ poolAddresses, setPoolAddresses ] = useState();
  const ADDRESSES = useAddresses()
  const roeRouter = useContract(ADDRESSES["roeRouter"], ROE_ROUTER_ABI);
  
  useEffect( () => async {
    try {
      const result = await roeRouter.pools(poolId)
      setPoolAddresses(result)
    }
    catch(e){
      console.log("Fetch Router", e);
    }
  }, [poolId])
  
  return poolAddresses ?? {}
}