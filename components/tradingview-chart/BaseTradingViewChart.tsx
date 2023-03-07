import dynamic from "next/dynamic";

export const BaseTradingViewChart = dynamic(
  () =>
    import("react-ts-tradingview-widgets").then(
      (widgets) => widgets.AdvancedRealTimeChart
    ),
  {
    ssr: false,
  }
);
