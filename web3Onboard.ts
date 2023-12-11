import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';

const supportedWalletsLabels = [
    ProviderLabel.OKXWallet,
    ProviderLabel.MetaMask,
    ProviderLabel.Rabby,
];

const supportedWalletsFilter = Object.fromEntries(
    Object.entries(ProviderLabel).map(([key, value]) => [
        key,
        supportedWalletsLabels.includes(value),
    ])
);

const injectedWalletsModule = injectedModule({
    filter: supportedWalletsFilter,
});

export default init({
    theme: 'dark',
    wallets: [injectedWalletsModule],

    chains: [
        {
            id: 42161,
            token: 'ETH',
            label: 'Arbitrum One',
            rpcUrl: 'https://endpoints.omniatech.io/v1/arbitrum/one/public'
        },
    ],

    connect: {
        iDontHaveAWalletLink: 'https://okx.com/web3',
        autoConnectLastWallet: true,
    },

    accountCenter: {
        desktop: {
            enabled: false,
        },

        mobile: {
            enabled: false,
        },
    },

    appMetadata: {
        name: 'Good Entry',
        icon: '<svg></svg>',
        logo: '/Good Entry Logo.svg',
        description: 'Good Entry',

        recommendedInjectedWallets: [
            {
                name: 'OKX Wallet',
                url: 'https://okx.com/web3',
            },
            {
                name: 'MetaMask',
                url: 'https://metamask.io',
            },
            {
                name: 'Rabby',
                url: 'https://rabby.io',
            }
        ],
    },

    disableFontDownload: true,
});
