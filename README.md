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
# Clone and install
git clone <repository-url>
cd orderbook-viewer
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start trading simulation.

## 📖 Documentation

- [Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [Architecture Overview](ARCHITECTURE.md) - Technical implementation details

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

## 🏗 Project Structure

```
src/
├── app/                    # Next.js app router
├── components/             # React components
├── services/              # API and WebSocket services
└── types/                 # TypeScript definitions
```

## 🔗 Supported Exchanges

| Exchange | WebSocket | Status |
|----------|-----------|---------|
| OKX      | ✅        | Live    |
| Bybit    | ✅        | Live    |
| Deribit  | ✅        | Live    |

## 📝 License

Educational and demonstration purposes only.