import { FC, memo } from "react";
import { BaseTradingViewChart } from "./BaseTradingViewChart";

interface TradingViewChartProps {
  symbol: string;
}

export const TradingViewChart: FC<TradingViewChartProps> = memo(
  ({ symbol }) => (
    <div style={{ width: 800, height: 400 }}>
      <BaseTradingViewChart
        theme="dark"
        autosize
        allow_symbol_change={false}
        symbol={symbol}
      ></BaseTradingViewChart>
    </div>
  )
);

TradingViewChart.displayName = "TradingViewChart";
