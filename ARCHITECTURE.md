# Architecture Overview

## System Architecture

The Orderbook Trading Simulator follows a modern React-based architecture with real-time data streaming capabilities.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Interface │    │   Application    │    │   Data Layer    │
│                 │    │      Logic       │    │                 │
│  ┌─────────────┐│    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│  │ Components  ││◄──►│ │ React Hooks  │ │◄──►│ │ WebSocket   │ │
│  └─────────────┘│    │ └──────────────┘ │    │ │ Services    │ │
│  ┌─────────────┐│    │ ┌──────────────┐ │    │ └─────────────┘ │
│  │ Tailwind    ││    │ │ State Mgmt   │ │    │ ┌─────────────┐ │
│  │ CSS         ││    │ │              │ │    │ │ Exchange    │ │
│  └─────────────┘│    │ └──────────────┘ │    │ │ APIs        │ │
└─────────────────┘    └──────────────────┘    │ └─────────────┘ │
                                               └─────────────────┘
```

## Core Components

### 1. Application Layer (`src/app/`)

**page.tsx** - Main application orchestrator
- Manages global state (selected venue, market data, simulated orders)
- Handles WebSocket connections via exchangeService
- Coordinates data flow between components
- Implements fullscreen mode and responsive layout

**layout.tsx** - Root layout configuration
- Sets up HTML structure and metadata
- Configures global styles and fonts
- Provides consistent layout across pages

### 2. Component Layer (`src/components/`)

**OrderBookViewer.tsx** - Core orderbook visualization
- Renders bid/ask levels with price and quantity
- Displays simulated order positions with visual indicators
- Handles fullscreen toggle and venue selection
- Calculates and shows market impact metrics
- Responsive design with mobile optimization

**OrderSimulationForm.tsx** - Order creation interface
- Two-line layout: title + controls
- Order type selection (Market/Limit)
- Side selection (Buy/Sell) with color coding
- Price input (conditional for limit orders)
- Quantity input with validation
- Delay selection (5s, 10s, 15s) with setTimeout implementation
- Form submission with order validation

**VenueSelector.tsx** - Exchange and connection management
- Exchange selection buttons (OKX, Bybit, Deribit)
- Trading pair display (currently BTC-USDT)
- Live connection indicator with Wifi/WifiOff icons
- Horizontal layout with right-aligned status

**TradesViewer.tsx** - Order history and analytics
- Displays simulated order history
- Shows order details and execution status
- Provides trade clearing functionality

### 3. Service Layer (`src/services/`)

**exchangeService.ts** - Data abstraction layer
- Manages WebSocket connections to multiple exchanges
- Handles connection lifecycle (connect, disconnect, reconnect)
- Normalizes data formats across different exchange APIs
- Implements fallback mechanisms for connection failures
- Rate limiting and error handling

#### Exchange Integration Details:

**OKX Integration**
- WebSocket: `wss://ws.okx.com:8443/ws/v5/public`
- Subscription: `{"op": "subscribe", "args": [{"channel": "books", "instId": "BTC-USDT"}]}`
- Data normalization from OKX format to internal OrderBook structure

**Bybit Integration**
- WebSocket: `wss://stream.bybit.com/v5/public/spot`
- Subscription: `{"op": "subscribe", "args": ["orderbook.1.BTCUSDT"]}`
- Symbol format conversion (BTC-USDT → BTCUSDT)

**Deribit Integration**
- WebSocket: `wss://www.deribit.com/ws/api/v2`
- Subscription: `{"method": "public/subscribe", "params": {"channels": ["book.BTC-PERPETUAL.100ms"]}}`
- Handles perpetual contract data structure

### 4. Type System (`src/types/`)

**orderbook.ts** - TypeScript definitions
```typescript
interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
  isLimitOrder?: boolean;
  limitOrderIndex?: number;
}

interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
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
}

interface Venue {
  id: string;
  name: string;
  wsUrl?: string;
  restUrl: string;
  isConnected: boolean;
}

interface MarketData {
  venue: string;
  orderbook: OrderBook;
  lastUpdate: number;
}
```

## Data Flow Architecture

### 1. Connection Establishment
```
User selects venue → exchangeService.connect() → WebSocket connection → 
Subscription to orderbook channel → Real-time data stream begins
```

### 2. Real-time Data Processing
```
Exchange WebSocket → Raw market data → exchangeService normalization → 
MarketData interface → React state update → Component re-render
```

### 3. Order Simulation Flow
```
User fills form → Form validation → SimulatedOrder creation → 
Delay application (setTimeout) → Order processing → 
State update → Visual indicators → Impact calculation
```

### 4. State Management Pattern
```
Global State (page.tsx)
├── selectedVenue: string
├── marketData: MarketData | null
├── simulatedOrders: SimulatedOrder[]
├── isConnected: boolean
└── venues: Venue[]

Component Props Flow:
page.tsx → OrderBookViewer (marketData, simulatedOrders)
page.tsx → OrderSimulationForm (onOrderSimulation callback)
page.tsx → VenueSelector (venues, selectedVenue, onVenueChange)
```

## Key Design Patterns

### 1. Observer Pattern
- WebSocket connections act as observables
- Components subscribe to data changes via React hooks
- Automatic re-rendering on state updates

### 2. Strategy Pattern
- Different exchange implementations behind common interface
- exchangeService abstracts venue-specific logic
- Consistent API regardless of exchange

### 3. Factory Pattern
- SimulatedOrder creation with unique IDs
- Venue configuration objects
- Standardized data structure creation

### 4. Callback Pattern
- Event handling between parent and child components
- onOrderSimulation, onVenueChange, onClearOrders callbacks
- Unidirectional data flow maintenance

## Performance Optimizations

### 1. React Optimizations
- useCallback for stable function references
- Conditional rendering for expensive components
- Efficient state updates with functional setState

### 2. WebSocket Management
- Connection pooling and reuse
- Automatic reconnection with exponential backoff
- Graceful degradation on connection failures

### 3. Data Processing
- Minimal data transformation in render cycle
- Pre-calculated totals and cumulative values
- Efficient array operations for orderbook updates

### 4. UI Optimizations
- Responsive design with mobile-first approach
- Efficient CSS with Tailwind utility classes
- Minimal DOM manipulations

## Error Handling Strategy

### 1. Network Errors
- WebSocket connection failures → Automatic retry
- API rate limiting → Exponential backoff
- CORS issues → Graceful fallback to demo data

### 2. Data Validation
- Form input validation before submission
- Type checking with TypeScript
- Runtime data structure validation

### 3. User Experience
- Loading states during connections
- Error messages for failed operations
- Fallback UI states for offline scenarios

## Security Considerations

### 1. Client-Side Security
- No sensitive data storage
- Read-only access to exchange APIs
- Input sanitization and validation

### 2. API Security
- Public endpoint usage only
- No authentication credentials required
- Rate limiting compliance

## Scalability Considerations

### 1. Component Architecture
- Modular component design for easy extension
- Reusable UI components
- Clear separation of concerns

### 2. Data Management
- Efficient state updates
- Memory management for large datasets
- Configurable data retention limits

### 3. Exchange Integration
- Pluggable exchange architecture
- Easy addition of new venues
- Standardized integration patterns

## Development Workflow

### 1. Code Organization
- Feature-based component structure
- Shared types and utilities
- Clear import/export patterns

### 2. Type Safety
- Strict TypeScript configuration
- Interface-driven development
- Compile-time error detection

### 3. Styling Approach
- Utility-first CSS with Tailwind
- Consistent design system
- Responsive design patterns

This architecture provides a solid foundation for real-time trading simulation with room for future enhancements like multiple symbol support, advanced order types, and portfolio management features.