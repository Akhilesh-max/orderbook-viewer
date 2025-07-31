// Core types for the orderbook application

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
  isLimitOrder?: boolean;
  limitOrderIndex?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface Venue {
  id: string;
  name: string;
  wsUrl?: string;
  restUrl: string;
  isConnected: boolean;
}

export interface SimulatedOrder {
  id: string; // Unique identifier for each order
  venue: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  quantity: number;
  timestamp: number; // When the order was created
}

export interface MarketData {
  venue: string;
  orderbook: OrderBook;
  lastUpdate: number;
}