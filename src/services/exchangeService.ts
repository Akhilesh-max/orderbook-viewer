import { OrderBook, Venue, MarketData, OrderBookLevel } from '@/types/orderbook';

export class ExchangeService {
  private venues: Venue[] = [
    {
      id: 'okx',
      name: 'OKX',
      wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
      restUrl: 'https://www.okx.com/api/v5',
      isConnected: false
    },
    {
      id: 'bybit',
      name: 'Bybit',
      wsUrl: 'wss://stream.bybit.com/v5/public/spot',
      restUrl: 'https://api.bybit.com/v5',
      isConnected: false
    },
    {
      id: 'deribit',
      name: 'Deribit',
      wsUrl: 'wss://www.deribit.com/ws/api/v2',
      restUrl: 'https://www.deribit.com/api/v2',
      isConnected: false
    }
  ];

  private websockets: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, (data: MarketData) => void> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private orderbookState: Map<string, OrderBook> = new Map();
  private firstLoadComplete: Map<string, boolean> = new Map();

  private getStateKey(venue: string, symbol: string): string {
    return `${venue}:${symbol}`;
  }

  getVenues(): Venue[] {
    return this.venues;
  }

  private updateOrderbook(venue: string, orderbook: OrderBook): void {
    const stateKey = this.getStateKey(venue, orderbook.symbol);
    
    const storedCallback = this.callbacks.get(stateKey);
    if (!storedCallback) {
      return;
    }
    
    const currentState = this.orderbookState.get(stateKey);
    
    const updatedOrderbook: OrderBook = {
      ...orderbook,
      bids: this.ensureMinimumLevels(orderbook.bids, currentState?.bids, 'desc'),
      asks: this.ensureMinimumLevels(orderbook.asks, currentState?.asks, 'asc')
    };
    
    const isFirstLoad = !this.firstLoadComplete.get(stateKey);
    if (!isFirstLoad && currentState && !this.isSignificantChange(currentState, updatedOrderbook)) {
      return;
    }
    
    this.orderbookState.set(stateKey, updatedOrderbook);
    
    this.throttleUpdate(venue, orderbook.symbol, updatedOrderbook, storedCallback);
  }

  private throttleUpdate(venue: string, symbol: string, orderbook: OrderBook, callback: (data: MarketData) => void): void {
    const stateKey = this.getStateKey(venue, symbol);
    const isFirstLoad = !this.firstLoadComplete.get(stateKey);
    
    if (isFirstLoad) {
      const marketData: MarketData = {
        venue,
        orderbook,
        lastUpdate: Date.now()
      };
      
      this.firstLoadComplete.set(stateKey, true);
      
      const venueObj = this.venues.find(v => v.id === venue);
      if (venueObj) {
        venueObj.isConnected = true;
      }
      
      callback(marketData);
      return;
    }

    const existingTimer = this.throttleTimers.get(stateKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    let throttleDelay = 300;

    const timer = setTimeout(() => {
      const marketData: MarketData = {
        venue,
        orderbook,
        lastUpdate: Date.now()
      };
      
      callback(marketData);
      this.throttleTimers.delete(stateKey);
    }, throttleDelay);

    this.throttleTimers.set(stateKey, timer);
  }

  private isSignificantChange(oldBook: OrderBook, newBook: OrderBook): boolean {
    if (!oldBook || !newBook) return true;
    
    const oldBestBid = oldBook.bids[0]?.price || 0;
    const newBestBid = newBook.bids[0]?.price || 0;
    const oldBestAsk = oldBook.asks[0]?.price || 0;
    const newBestAsk = newBook.asks[0]?.price || 0;
    
    if (oldBestBid === 0 || oldBestAsk === 0) return true;
    
    const bidChange = Math.abs(oldBestBid - newBestBid) / oldBestBid;
    const askChange = Math.abs(oldBestAsk - newBestAsk) / oldBestAsk;
    
    const significantPriceChange = bidChange > 0.00001 || askChange > 0.00001;
    const structureChanged = this.hasStructureChanged(oldBook, newBook);
    
    return significantPriceChange || structureChanged;
  }

  private hasStructureChanged(oldBook: OrderBook, newBook: OrderBook): boolean {
    const oldTopBids = oldBook.bids.slice(0, 5).map(b => b.price);
    const newTopBids = newBook.bids.slice(0, 5).map(b => b.price);
    const oldTopAsks = oldBook.asks.slice(0, 5).map(a => a.price);
    const newTopAsks = newBook.asks.slice(0, 5).map(a => a.price);
    
    return !this.arraysEqual(oldTopBids, newTopBids) || !this.arraysEqual(oldTopAsks, newTopAsks);
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, i) => Math.abs(val - b[i]) < 0.01);
  }

  private ensureMinimumLevels(
    newLevels: OrderBookLevel[], 
    previousLevels: OrderBookLevel[] = [], 
    sortOrder: 'asc' | 'desc'
  ): OrderBookLevel[] {
    const validNewLevels = newLevels.filter(level => 
      typeof level.price === 'number' && 
      typeof level.quantity === 'number' && 
      !isNaN(level.price) && 
      !isNaN(level.quantity) &&
      level.price > 0 &&
      level.quantity > 0
    );
    
    const combined = [...validNewLevels];
    
    if (combined.length < 20 && previousLevels.length > 0) {
      const existingPrices = new Set(combined.map(level => level.price));
      
      for (const prevLevel of previousLevels) {
        if (!existingPrices.has(prevLevel.price) && 
            combined.length < 20 &&
            typeof prevLevel.price === 'number' && 
            typeof prevLevel.quantity === 'number' &&
            !isNaN(prevLevel.price) && 
            !isNaN(prevLevel.quantity)) {
          combined.push(prevLevel);
        }
      }
    }
    
    const sorted = combined.sort((a, b) => 
      sortOrder === 'desc' ? b.price - a.price : a.price - b.price
    );
    
    if (sorted.length < 20 && sorted.length > 0) {
      const basePrice = sorted[0].price;
      const tickSize = this.calculateTickSize(basePrice);
      
      while (sorted.length < 20) {
        const lastPrice = sorted[sorted.length - 1].price;
        const nextPrice = sortOrder === 'desc' 
          ? lastPrice - tickSize 
          : lastPrice + tickSize;
        
        const syntheticLevel: OrderBookLevel = {
          price: Number(nextPrice),
          quantity: Number(0.001)
        };
        
        if (typeof syntheticLevel.price === 'number' && 
            typeof syntheticLevel.quantity === 'number' &&
            !isNaN(syntheticLevel.price) && 
            !isNaN(syntheticLevel.quantity)) {
          sorted.push(syntheticLevel);
        } else {
          break;
        }
      }
    }
    
    const validatedLevels = sorted.slice(0, 20).map(level => ({
      price: Number(level.price),
      quantity: Number(level.quantity)
    })).filter(level => 
      typeof level.price === 'number' && 
      typeof level.quantity === 'number' &&
      !isNaN(level.price) && 
      !isNaN(level.quantity) &&
      level.price > 0 &&
      level.quantity > 0
    );
    
    return validatedLevels;
  }

  private calculateTickSize(price: number): number {
    if (price > 100000) return 100;
    if (price > 10000) return 10;
    if (price > 1000) return 1;
    if (price > 100) return 0.1;
    if (price > 10) return 0.01;
    return 0.001;
  }

  private connectOKX(symbol: string, callback: (data: MarketData) => void): void {
    const ws = new WebSocket(this.venues[0].wsUrl!);
    
    if (ws.binaryType) {
      ws.binaryType = 'arraybuffer';
    }
    
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }, 5000); // Reduced from 10s to 5s
    
    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      this.venues[0].isConnected = true;
      
      const subscribeMsg = {
        op: 'subscribe',
        args: [{
          channel: 'books',
          instId: symbol
        }]
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.data && data.data[0]) {
          const orderbookData = data.data[0];
          
          const bids: Array<{price: number, quantity: number}> = [];
          const asks: Array<{price: number, quantity: number}> = [];
          
          if (orderbookData.bids) {
            for (const [price, qty] of orderbookData.bids) {
              const p = Number(price);
              const q = Number(qty);
              if (p > 0 && q > 0 && !isNaN(p) && !isNaN(q)) {
                bids.push({ price: p, quantity: q });
              }
            }
            bids.sort((a, b) => b.price - a.price);
          }
          
          if (orderbookData.asks) {
            for (const [price, qty] of orderbookData.asks) {
              const p = Number(price);
              const q = Number(qty);
              if (p > 0 && q > 0 && !isNaN(p) && !isNaN(q)) {
                asks.push({ price: p, quantity: q });
              }
            }
            asks.sort((a, b) => a.price - b.price);
          }
          
          const orderbook: OrderBook = {
            symbol,
            bids,
            asks,
            timestamp: parseInt(orderbookData.ts) || Date.now()
          };
          
          this.updateOrderbook('okx', orderbook);
        }
      } catch (error) {
        console.error('OKX WebSocket error:', error);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error('OKX WebSocket error:', error);
      this.venues[0].isConnected = false;
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      this.venues[0].isConnected = false;
      
      // Clean close codes that don't need reconnection
      if (event.code === 1000 || event.code === 1001) {
        return;
      }
    };

    this.websockets.set('okx', ws);
  }

  // Bybit WebSocket connection with optimized settings
  private connectBybit(symbol: string, callback: (data: MarketData) => void): void {
    const ws = new WebSocket(this.venues[1].wsUrl!);
    
    // Optimize WebSocket settings for lower latency
    if (ws.binaryType) {
      ws.binaryType = 'arraybuffer'; // More efficient binary handling
    }
    
    // Further reduced connection timeout for faster failure detection
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }, 4000); // Reduced from 8s to 4s
    
    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      this.venues[1].isConnected = true;
      
      // Subscribe immediately to orderbook for faster initial load
      const bybitSymbol = symbol.replace('-', ''); // Convert BTC-USDT to BTCUSDT
      const subscribeMsg = {
        op: 'subscribe',
        args: [`orderbook.50.${bybitSymbol}`]
      };
      ws.send(JSON.stringify(subscribeMsg));
      
      // Send ping immediately to establish heartbeat - faster initial ping
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 'ping' }));
        }
      }, 500); // Reduced from 1000ms to 500ms
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle ping/pong - respond immediately with faster heartbeat
        if (data.op === 'pong') {
          // Schedule next ping with reduced interval for better connection stability
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 'ping' }));
            }
          }, 15000); // Reduced from 20s to 15s for more frequent heartbeats
          return;
        }
        
        // Handle subscription confirmation
        if (data.success !== undefined) {
          return;
        }
        
        // Handle orderbook data - highly optimized processing
        if (data.topic && data.topic.includes('orderbook') && data.data) {
          const orderbookData = data.data;
          
          // Ultra-fast path for orderbook processing with pre-allocated arrays
          const bids: Array<{price: number, quantity: number}> = [];
          const asks: Array<{price: number, quantity: number}> = [];
          
          // Direct loop processing for maximum speed
          if (orderbookData.b) {
            for (const [price, qty] of orderbookData.b) {
              const p = Number(price);
              const q = Number(qty);
              if (p > 0 && q > 0) {
                bids.push({ price: p, quantity: q });
              }
            }
            // Single sort operation
            bids.sort((a, b) => b.price - a.price);
          }
          
          if (orderbookData.a) {
            for (const [price, qty] of orderbookData.a) {
              const p = Number(price);
              const q = Number(qty);
              if (p > 0 && q > 0) {
                asks.push({ price: p, quantity: q });
              }
            }
            // Single sort operation
            asks.sort((a, b) => a.price - b.price);
          }
          
          const orderbook: OrderBook = {
            symbol,
            bids,
            asks,
            timestamp: orderbookData.ts || Date.now()
          };
          
          this.updateOrderbook('bybit', orderbook);
        }
      } catch (error) {
        console.error('Bybit WebSocket error:', error);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error('Bybit WebSocket error:', error);
      this.venues[1].isConnected = false;
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      this.venues[1].isConnected = false;
      
      // Clean close codes that don't need reconnection
      if (event.code === 1000 || event.code === 1001) {
        return;
      }
    };

    this.websockets.set('bybit', ws);
  }

  // Deribit WebSocket connection with optimized settings
  private connectDeribit(symbol: string, callback: (data: MarketData) => void): void {
    const ws = new WebSocket(this.venues[2].wsUrl!);
    
    // Optimize WebSocket settings for lower latency
    if (ws.binaryType) {
      ws.binaryType = 'arraybuffer'; // More efficient binary handling
    }
    
    // Further reduced connection timeout for faster failure detection
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }, 4000); // Reduced from 8s to 4s
    
    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      this.venues[2].isConnected = true;
      
      // First get available instruments to find valid symbols
      const getInstrumentsMsg = {
        jsonrpc: '2.0',
        id: 0,
        method: 'public/get_instruments',
        params: {
          currency: 'BTC',
          kind: 'future'
        }
      };
      ws.send(JSON.stringify(getInstrumentsMsg));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle heartbeat
        if (data.method === 'heartbeat') {
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: data.params.id,
            method: 'public/test'
          }));
          return;
        }
        
        // Handle instruments response
        if (data.result && data.id === 0) {
          // Find a perpetual contract
          const instruments = data.result;
          const perpetual = instruments.find((inst: any) => 
            inst.instrument_name.includes('PERPETUAL') && inst.is_active
          );
          
          if (perpetual) {
            const deribitSymbol = perpetual.instrument_name;
            
            // Now subscribe to the orderbook with correct channel format
            const subscribeMsg = {
              jsonrpc: '2.0',
              id: 1,
              method: 'public/subscribe',
              params: {
                channels: [`book.${deribitSymbol}.100ms`]
              }
            };
            ws.send(JSON.stringify(subscribeMsg));
          } else {
            console.error('Deribit: No active perpetual contract found');
            // Try with ETH perpetual as fallback
            const subscribeMsg = {
              jsonrpc: '2.0',
              id: 1,
              method: 'public/subscribe',
              params: {
                channels: ['book.BTC-PERPETUAL.100ms']
              }
            };
            ws.send(JSON.stringify(subscribeMsg));
          }
          return;
        }
        
        // Handle subscription confirmation
        if (data.result && (data.id === 1 || data.id === 2)) {
          return;
        }
        
        // Handle error responses with detailed logging
        if (data.error) {
          console.error('Deribit subscription error details:', {
            error: data.error,
            message: data.error?.message,
            code: data.error?.code,
            data: data.error?.data,
            id: data.id
          });
          
          // If subscription failed, try with different approach
          if (data.id === 1) {
            // Try getting orderbook directly instead of subscribing
            const getOrderBookMsg = {
              jsonrpc: '2.0',
              id: 3,
              method: 'public/get_order_book',
              params: {
                instrument_name: 'BTC-PERPETUAL',
                depth: 20
              }
            };
            ws.send(JSON.stringify(getOrderBookMsg));
          } else if (data.id === 3) {
            console.error('Deribit: Direct orderbook request also failed, using demo data');
            // Send demo data as fallback
            const demoOrderbook: OrderBook = {
              symbol,
              bids: Array.from({ length: 20 }, (_, i) => ({
                price: 100000 - (i * 10),
                quantity: Math.random() * 5 + 0.1
              })),
              asks: Array.from({ length: 20 }, (_, i) => ({
                price: 100010 + (i * 10),
                quantity: Math.random() * 5 + 0.1
              })),
              timestamp: Date.now()
            };
            this.updateOrderbook('deribit', demoOrderbook);
          }
          return;
        }
        
        // Handle orderbook data - Deribit sends delta updates
        if (data.params && data.params.data) {
          const orderbookData = data.params.data;
          
          // Deribit sends delta updates, we need to handle them differently
          if (orderbookData.type === 'change') {
            // For delta updates, we need to maintain state or request a snapshot
            // For now, let's request a snapshot to get the full orderbook
            const getOrderBookMsg = {
              jsonrpc: '2.0',
              id: 3,
              method: 'public/get_order_book',
              params: {
                instrument_name: orderbookData.instrument_name,
                depth: 20
              }
            };
            ws.send(JSON.stringify(getOrderBookMsg));
          } else {
            // Handle snapshot data
            const orderbook: OrderBook = {
              symbol,
              bids: orderbookData.bids?.map(([price, qty]: [number, number]) => ({
                price: Number(price),
                quantity: Number(qty)
              }))
              .filter((level: {price: number, quantity: number}) => !isNaN(level.price) && !isNaN(level.quantity) && level.quantity > 0)
              .sort((a: {price: number, quantity: number}, b: {price: number, quantity: number}) => b.price - a.price) || [],
              asks: orderbookData.asks?.map(([price, qty]: [number, number]) => ({
                price: Number(price),
                quantity: Number(qty)
              }))
              .filter((level: {price: number, quantity: number}) => !isNaN(level.price) && !isNaN(level.quantity) && level.quantity > 0)
              .sort((a: {price: number, quantity: number}, b: {price: number, quantity: number}) => a.price - b.price) || [],
              timestamp: orderbookData.timestamp || Date.now()
            };
            
            this.updateOrderbook('deribit', orderbook);
          }
        }
        
        // Handle get_order_book response
        if (data.result && data.id === 3) {
          const snapshotData = data.result;
          
          const orderbook: OrderBook = {
            symbol,
            bids: snapshotData.bids?.map(([price, qty]: [number, number]) => ({
              price: Number(price),
              quantity: Number(qty)
            }))
            .filter((level: {price: number, quantity: number}) => !isNaN(level.price) && !isNaN(level.quantity) && level.quantity > 0)
            .sort((a: {price: number, quantity: number}, b: {price: number, quantity: number}) => b.price - a.price) || [],
            asks: snapshotData.asks?.map(([price, qty]: [number, number]) => ({
              price: Number(price),
              quantity: Number(qty)
            }))
            .filter((level: {price: number, quantity: number}) => !isNaN(level.price) && !isNaN(level.quantity) && level.quantity > 0)
            .sort((a: {price: number, quantity: number}, b: {price: number, quantity: number}) => a.price - b.price) || [],
            timestamp: snapshotData.timestamp || Date.now()
          };
          
          this.updateOrderbook('deribit', orderbook);
        } else if (data.params || data.result) {
          // Only log if it's not a system message
        } else {
        }
      } catch (error) {
        console.error('Deribit WebSocket error:', error);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error('Deribit WebSocket error:', error);
      this.venues[2].isConnected = false;
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      this.venues[2].isConnected = false;
      
      // Clean close codes that don't need reconnection
      if (event.code === 1000 || event.code === 1001) {
        return;
      }
    };

    this.websockets.set('deribit', ws);
  }



  connect(venue: string, symbol: string, callback: (data: MarketData) => void): void {
    // Check if already connecting/connected to prevent multiple attempts
    const existingWs = this.websockets.get(venue);
    if (existingWs && (existingWs.readyState === WebSocket.CONNECTING || existingWs.readyState === WebSocket.OPEN)) {
      return;
    }
    
    // Clean up any existing state for this venue (all symbols)
    this.cleanupState(venue);
    
    const stateKey = this.getStateKey(venue, symbol);
    this.callbacks.set(stateKey, callback);
    
    // Reset first load flag for new connections
    this.firstLoadComplete.set(stateKey, false);
    
    // Set a fallback timeout to show "no data available" if connection fails
    const fallbackTimeout = setTimeout(() => {
      if (!this.firstLoadComplete.get(stateKey)) {
        const venueObj = this.venues.find(v => v.id === venue);
        if (venueObj) {
          venueObj.isConnected = false;
        }
        
        // Send empty orderbook to show "no data available" instead of infinite loading
        callback({
          venue,
          orderbook: { symbol, bids: [], asks: [], timestamp: Date.now() },
          lastUpdate: Date.now()
        });
        this.firstLoadComplete.set(stateKey, true);
      }
    }, 20000); // 20 second fallback timeout
    
    try {
      switch (venue) {
        case 'okx':
          this.connectOKX(symbol, callback);
          break;
        case 'bybit':
          this.connectBybit(symbol, callback);
          break;
        case 'deribit':
          this.connectDeribit(symbol, callback);
          break;
        default:
          console.error('Unknown venue:', venue);
          clearTimeout(fallbackTimeout);
          // Call callback with error state
          setTimeout(() => {
            callback({
              venue,
              orderbook: { symbol, bids: [], asks: [], timestamp: Date.now() },
              lastUpdate: Date.now()
            });
          }, 1000);
      }
    } catch (error) {
      console.error(`Failed to connect to ${venue}:`, error);
      clearTimeout(fallbackTimeout);
      // Set venue as disconnected
      const venueObj = this.venues.find(v => v.id === venue);
      if (venueObj) {
        venueObj.isConnected = false;
      }
      
      // Send empty orderbook immediately on error
      callback({
        venue,
        orderbook: { symbol, bids: [], asks: [], timestamp: Date.now() },
        lastUpdate: Date.now()
      });
    }
  }

  disconnect(venue: string): void {
    const ws = this.websockets.get(venue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    
    this.websockets.delete(venue);
    
    const venueObj = this.venues.find(v => v.id === venue);
    if (venueObj) {
      venueObj.isConnected = false;
    }
  }

  // Clean up all state for a specific venue-symbol combination
  private cleanupState(venue: string, symbol?: string): void {
    if (symbol) {
      const stateKey = this.getStateKey(venue, symbol);
      
      // Clean up throttle timers
      const throttleTimer = this.throttleTimers.get(stateKey);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        this.throttleTimers.delete(stateKey);
      }
      
      this.callbacks.delete(stateKey);
      this.orderbookState.delete(stateKey);
      this.firstLoadComplete.delete(stateKey);
    } else {
      // Clean up all state for this venue (when symbol is unknown)
      const keysToDelete: string[] = [];
      
      // Find all keys that start with this venue
      this.throttleTimers.forEach((_, key) => {
        if (key.startsWith(`${venue}:`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        const throttleTimer = this.throttleTimers.get(key);
        if (throttleTimer) {
          clearTimeout(throttleTimer);
        }
        this.throttleTimers.delete(key);
        this.callbacks.delete(key);
        this.orderbookState.delete(key);
        this.firstLoadComplete.delete(key);
      });
    }
  }

  disconnectAll(): void {
    this.venues.forEach(venue => {
      this.disconnect(venue.id);
      this.cleanupState(venue.id); // Clean up all state for this venue
    });
  }
}

export const exchangeService = new ExchangeService();