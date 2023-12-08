import React from "react";
import { Button, Dropdown } from "antd";
import { useSetChain } from "@web3-onboard/react";

const NavChain = () => {
  const [
    {
      connectedChain
    },
  ] = useSetChain() ?? {};

  const chainId = Number(connectedChain?.id);

  const onClick = async ({ key }) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + parseInt(key).toString(16) }],
      });
    } catch (e) {
      console.log("Switch chain", e);
    }
  };

  if (!chainId) return <></>;

  const items = [
    {
      key: "42161",
      label: "Arbitrum",
      icon: (
        <img
          src="/icons/arbitrum.svg"
          height={16}
          width={16}
          alt="Arbitrum Logo"
        />
      ),
    },
    /*{
      key: '137',
      label: "Polygon",
      icon: <img src="/icons/polygon.svg" height={16} width={16} />
    },
    {
      key: '1',
      label: "Ethereum",
      icon: <img src="/icons/ethereum.svg" height={16} width={16} />
    },*/
    {
      key: '31337',
      label: "Localhost-Fork",
      icon: <img src="/icons/arbitrum.svg" height={16} width={16} alt="Arbitrum Logo" />
    },
  ];

  let label = {};
  for (let k of items) if (k.key == chainId) label = k;

  return(<>
  <Dropdown menu={{ items, onClick }}>
    <a onClick={(e) => e.preventDefault()}>
      <Button style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 24}}
        icon={label.icon}
      >
        {label.label ? label.label : 'Wrong Network'}
      </Button>
    </a>
  </Dropdown>
  </>)
};

export default NavChain;
