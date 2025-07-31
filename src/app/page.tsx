'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderBookViewer } from '@/components/OrderBookViewer';
import { OrderSimulationForm } from '@/components/OrderSimulationForm';
import { TradesViewer } from '@/components/TradesViewer';
import { exchangeService } from '@/services/exchangeService';
import { MarketData, SimulatedOrder, Venue } from '@/types/orderbook';

export default function Home() {
  const [selectedVenue, setSelectedVenue] = useState<string>('okx');
  const symbol = 'BTC-USDT';
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [simulatedOrders, setSimulatedOrders] = useState<SimulatedOrder[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleMarketData = useCallback((data: MarketData) => {
    if (data.venue !== selectedVenue || data.orderbook.symbol !== symbol) {
      return;
    }
    setIsConnected(true);
    setMarketData(data);
  }, [selectedVenue, symbol]);

  const connectToVenue = useCallback(() => {
    setMarketData(null);
    setIsConnected(false);
    exchangeService.disconnectAll();
    
    setTimeout(() => {
      exchangeService.connect(selectedVenue, symbol, handleMarketData);
    }, 100);
  }, [selectedVenue, symbol, handleMarketData]);

  useEffect(() => {
    setVenues(exchangeService.getVenues());
    connectToVenue();
    return () => exchangeService.disconnectAll();
  }, [connectToVenue]);

  const handleVenueChange = (venueId: string) => {
    setSelectedVenue(venueId);
    setSimulatedOrders([]);
    setIsConnected(false);
  };

  const handleOrderSimulation = (order: SimulatedOrder) => {
    const orderWithId = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setSimulatedOrders(prev => [orderWithId, ...prev].slice(0, 10));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const clearSimulatedOrders = () => {
    setSimulatedOrders([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Orderbook Trading Simulator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time order simulation across crypto exchanges
          </p>
        </header>

        <div className="mb-6">
          <OrderSimulationForm
            selectedVenue={selectedVenue}
            symbol={symbol}
            onOrderSimulation={handleOrderSimulation}
          />
        </div>

        {isFullscreen ? (
          <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 p-4">
            <OrderBookViewer
              marketData={marketData}
              simulatedOrders={simulatedOrders}
              venue={selectedVenue}
              onClearOrders={clearSimulatedOrders}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              venues={venues}
              selectedVenue={selectedVenue}
              onVenueChange={handleVenueChange}
              symbol={symbol}
              isConnected={isConnected}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OrderBookViewer
                marketData={marketData}
                simulatedOrders={simulatedOrders}
                venue={selectedVenue}
                onClearOrders={clearSimulatedOrders}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                venues={venues}
                selectedVenue={selectedVenue}
                onVenueChange={handleVenueChange}
                symbol={symbol}
                isConnected={isConnected}
              />
            </div>

            <div className="lg:col-span-1">
              <TradesViewer
                simulatedOrders={simulatedOrders}
                onClearTrades={clearSimulatedOrders}
                marketData={marketData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}