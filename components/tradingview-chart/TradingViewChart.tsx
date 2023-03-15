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
        hide_top_toolbar={true}
        hide_side_toolbar={true}
        save_image={false}
        symbol={symbol}
        interval="1"
        withdateranges={false}
        calendar={false}
      />
    </div>
  )
);

TradingViewChart.displayName = "TradingViewChart";
