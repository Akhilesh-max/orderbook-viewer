# Orderbook Trading Simulator

A modern Next.js application for real-time cryptocurrency orderbook visualization and trade simulation across multiple exchanges.

## ✨ Features

- **Multi-Exchange Support** - OKX, Bybit, and Deribit integration
- **Real-Time Data** - Live orderbook updates via WebSocket connections
- **Order Simulation** - Test market and limit orders with configurable delays
- **Visual Impact Analysis** - See order placement and market impact
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark Mode** - Automatic theme switching

## 🚀 Quick Start

```bash
git clone https://github.com/Akhilesh-max/orderbook-viewer.git
cd orderbook-viewer
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start trading simulation.

## 🎯 How to Use

### Exchange Selection
Choose from OKX, Bybit, or Deribit exchanges. The live indicator shows connection status.

### Order Simulation
1. **Type** - Market or Limit orders
2. **Side** - Buy or Sell
3. **Price** - Set limit price (limit orders only)
4. **Quantity** - Order size
5. **Delay** - Execution timing (5s, 10s, 15s)

### Orderbook Visualization
- **Green** - Bid orders (buyers)
- **Red** - Ask orders (sellers)  
- **Highlights** - Your simulated order positions
- **Depth Bars** - Cumulative volume visualization

## 🛠 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **WebSocket APIs** - Real-time exchange data
- **Lucide React** - Modern icon library

## 🏗 Code Structure

### Core Components

**`src/app/page.tsx`** - Main application orchestrator
- Manages global state and WebSocket connections
- Coordinates data flow between components

**`src/components/OrderBookViewer.tsx`** - Orderbook visualization
- Renders bid/ask levels with real-time updates
- Shows simulated order positions with visual indicators

**`src/components/OrderSimulationForm.tsx`** - Order creation interface
- Handles order type, side, price, quantity, and delay inputs
- Form validation and submission

**`src/services/exchangeService.ts`** - WebSocket management
- Manages connections to multiple exchanges
- Normalizes data formats and handles reconnections

### Key Types

```typescript
interface OrderBookLevel {
  price: number;
  quantity: number;
  isLimitOrder?: boolean;
  limitOrderIndex?: number;
}

interface SimulatedOrder {
  id: string;
  venue: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  quantity: number;
  timestamp: number;
  timing?: number;
}
```

### Data Flow

1. **Connection**: User selects venue → WebSocket connection established
2. **Real-time Updates**: Exchange data → Service normalization → React state
3. **Order Simulation**: Form submission → Order creation → Visual feedback

## 🔗 Exchange Integration

| Exchange | WebSocket Endpoint | Data Format |
|----------|-------------------|-------------|
| OKX      | `wss://ws.okx.com:8443/ws/v5/public` | Standard orderbook |
| Bybit    | `wss://stream.bybit.com/v5/public/spot` | Spot trading data |
| Deribit  | `wss://www.deribit.com/ws/api/v2` | Perpetual contracts |

Each exchange connection handles:
- Automatic reconnection on failures
- Data normalization to common format
- Rate limiting and error handling

## 📝 License

Educational and demonstration purposes only.