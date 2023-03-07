import { FC } from "react";
import { TradingViewChart } from "../tradingview-chart/TradingViewChart";

interface ChartProps {
  symbol: string;
}

export const Chart: FC<ChartProps> = ({ symbol }) => (
  <TradingViewChart symbol={symbol} />
);
