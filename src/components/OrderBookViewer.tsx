import { useMemo, memo } from 'react';
import { MarketData, SimulatedOrder, OrderBookLevel, Venue } from '@/types/orderbook';
import { TrendingUp, TrendingDown, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { VenueSelector } from './VenueSelector';

interface OrderBookViewerProps {
  marketData: MarketData | null;
  simulatedOrders: SimulatedOrder[];
  venue: string;
  onClearOrders: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  venues: Venue[];
  selectedVenue: string;
  onVenueChange: (venueId: string) => void;
  symbol: string;
  isConnected: boolean;
}

function OrderBookViewerComponent({
  marketData,
  simulatedOrders,
  venue,
  onClearOrders,
  isFullscreen = false,
  onToggleFullscreen,
  venues,
  selectedVenue,
  onVenueChange,
  symbol,
  isConnected
}: OrderBookViewerProps) {
  const limitOrders = useMemo(() => {
    return simulatedOrders.filter(order => order.type === 'limit');
  }, [simulatedOrders]);

  const currentPrice = useMemo(() => {
    if (!marketData?.orderbook) return null;

    const bestBid = marketData.orderbook.bids[0]?.price || 0;
    const bestAsk = marketData.orderbook.asks[0]?.price || 0;

    return {
      price: (bestBid + bestAsk) / 2,
      source: 'mid_price'
    };
  }, [marketData]);

  const processedData = useMemo(() => {
    if (!marketData || !marketData.orderbook || !marketData.orderbook.bids || !marketData.orderbook.asks) {
      return null;
    }

    const { orderbook } = marketData;

    if (orderbook.symbol !== symbol || marketData.venue !== selectedVenue) {
      return null;
    }

    const injectLimitOrders = (levels: any[], side: 'buy' | 'sell') => {
      const relevantOrders = limitOrders.filter(order => order.side === side && order.price);
      let combinedLevels = [...levels];

      relevantOrders.forEach((order, orderIndex) => {
        if (order.price) {
          const existingLevelIndex = combinedLevels.findIndex(level => 
            Math.abs(level.price - order.price!) < 0.01
          );

          if (existingLevelIndex !== -1) {
            combinedLevels[existingLevelIndex] = {
              ...combinedLevels[existingLevelIndex],
              quantity: combinedLevels[existingLevelIndex].quantity + order.quantity,
              isLimitOrder: true,
              limitOrderIndex: orderIndex
            };
          } else {
            combinedLevels.push({
              price: order.price,
              quantity: order.quantity,
              isLimitOrder: true,
              limitOrderIndex: orderIndex
            });
          }
        }
      });

      return combinedLevels;
    };

    let bidsWithOrders = injectLimitOrders(orderbook.bids, 'buy');
    const sortedBids = bidsWithOrders
      .filter(bid =>
        bid &&
        typeof bid.price === 'number' &&
        typeof bid.quantity === 'number' &&
        !isNaN(bid.price) &&
        !isNaN(bid.quantity) &&
        bid.price > 0 &&
        bid.quantity >= 0
      )
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 20);

    const bidsWithTotal = sortedBids
      .map((bid, index) => ({
        ...bid,
        price: Number(bid.price),
        quantity: Number(bid.quantity),
        total: sortedBids.slice(0, index + 1).reduce((sum, b) =>
          sum + (typeof b.quantity === 'number' && !isNaN(b.quantity) ? Number(b.quantity) : 0), 0)
      }));

    let asksWithOrders = injectLimitOrders(orderbook.asks, 'sell');
    const sortedAsks = asksWithOrders
      .filter(ask =>
        ask &&
        typeof ask.price === 'number' &&
        typeof ask.quantity === 'number' &&
        !isNaN(ask.price) &&
        !isNaN(ask.quantity) &&
        ask.price > 0 &&
        ask.quantity >= 0
      )
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 20);

    const asksWithTotal = sortedAsks
      .map((ask, index) => ({
        ...ask,
        price: Number(ask.price),
        quantity: Number(ask.quantity),
        total: sortedAsks.slice(0, index + 1).reduce((sum, a) =>
          sum + (typeof a.quantity === 'number' && !isNaN(a.quantity) ? Number(a.quantity) : 0), 0)
      }));

    const maxTotal = Math.max(
      bidsWithTotal[bidsWithTotal.length - 1]?.total || 0,
      asksWithTotal[asksWithTotal.length - 1]?.total || 0
    );

    return {
      orderbook,
      bidsWithTotal,
      asksWithTotal,
      maxTotal
    };
  }, [marketData, symbol, selectedVenue, limitOrders]);

  const orderColors = [
    { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
    { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' }
  ];

  if (!processedData) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Activity size={32} className="text-blue-500 dark:text-blue-400 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Connecting to {venue.toUpperCase()}...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Loading {symbol} orderbook
            </p>
            <div className="mt-3 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { orderbook, bidsWithTotal, asksWithTotal, maxTotal } = processedData;



  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${isFullscreen ? 'h-full flex flex-col' : ''
      }`}>
      {/* Venue Selection */}
      <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-t-xl">
        <VenueSelector
          venues={venues}
          selectedVenue={selectedVenue}
          onVenueChange={onVenueChange}
          isConnected={isConnected}
        />
      </div>

      <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {orderbook.symbol} Orderbook
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                  {venue.toUpperCase()}
                </span>
              </div>

              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
            </div>

            {simulatedOrders.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {simulatedOrders.length} simulated order{simulatedOrders.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={onClearOrders}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 border border-gray-300/50 dark:border-gray-600/50"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Current Price Display */}
          {currentPrice && (
            <div className="text-right bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
              <div className="font-mono font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                <span className="text-sm">Current Price (Mid): </span>
                <span className="text-lg">${currentPrice.price.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Spread: ${((orderbook.asks[0]?.price || 0) - (orderbook.bids[0]?.price || 0)).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>



      <div className={`p-6 ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Bids (Buy)
              </h3>
            </div>
            <div className="space-y-0.5">
              <div className="grid grid-cols-3 text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <div>Price</div>
                <div className="text-right">Size</div>
                <div className="text-right">Total</div>
              </div>
              {bidsWithTotal.length > 0 ? bidsWithTotal.map((bid, index) => {
                const isLimitOrder = bid.isLimitOrder;
                const orderStyling = isLimitOrder ? orderColors[bid.limitOrderIndex % 5] : null;

                return (
                  <div
                    key={`bid-${index}`}
                    className={`grid grid-cols-3 text-sm font-mono relative rounded-md transition-all duration-200 ${orderStyling
                      ? `${orderStyling.bg} border-l-4 ${orderStyling.border}`
                      : 'hover:bg-gradient-to-r hover:from-green-50/80 hover:to-emerald-50/80 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20'
                      }`}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-100/60 to-emerald-100/60 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md"
                      style={{
                        width: `${(bid.total / maxTotal) * 100}%`,
                        opacity: 0.4
                      }}
                    />
                    {isLimitOrder && (
                      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse z-20 shadow-sm" title="Your Limit Order" />
                    )}
                    <div className="relative z-10 text-green-600 dark:text-green-400 py-2 px-2 font-medium">
                      {typeof bid.price === 'number' && !isNaN(bid.price) ? bid.price.toFixed(2) : '0.00'}
                    </div>
                    <div className="relative z-10 text-right py-2 px-2 text-gray-700 dark:text-gray-300">
                      {typeof bid.quantity === 'number' && !isNaN(bid.quantity) ? bid.quantity.toFixed(4) : '0.0000'}
                    </div>
                    <div className="relative z-10 text-right text-gray-500 dark:text-gray-400 py-2 px-2">
                      {typeof bid.total === 'number' && !isNaN(bid.total) ? bid.total.toFixed(4) : '0.0000'}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <TrendingDown size={16} className="text-gray-400" />
                  </div>
                  No bid data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-lg">
                <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                Asks (Sell)
              </h3>
            </div>
            <div className="space-y-0.5">
              <div className="grid grid-cols-3 text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <div>Price</div>
                <div className="text-right">Size</div>
                <div className="text-right">Total</div>
              </div>
              {asksWithTotal.length > 0 ? asksWithTotal.map((ask, index) => {
                const isLimitOrder = ask.isLimitOrder;
                const orderStyling = isLimitOrder ? orderColors[ask.limitOrderIndex % 5] : null;

                return (
                  <div
                    key={`ask-${index}`}
                    className={`grid grid-cols-3 text-sm font-mono relative rounded-md transition-all duration-200 ${orderStyling
                      ? `${orderStyling.bg} border-l-4 ${orderStyling.border}`
                      : 'hover:bg-gradient-to-r hover:from-red-50/80 hover:to-rose-50/80 dark:hover:from-red-900/20 dark:hover:to-rose-900/20'
                      }`}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-red-100/60 to-rose-100/60 dark:from-red-900/20 dark:to-rose-900/20 rounded-md"
                      style={{
                        width: `${(ask.total / maxTotal) * 100}%`,
                        opacity: 0.4
                      }}
                    />
                    {isLimitOrder && (
                      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse z-20 shadow-sm" title="Your Limit Order" />
                    )}
                    <div className="relative z-10 text-red-600 dark:text-red-400 py-2 px-2 font-medium">
                      {typeof ask.price === 'number' && !isNaN(ask.price) ? ask.price.toFixed(2) : '0.00'}
                    </div>
                    <div className="relative z-10 text-right py-2 px-2 text-gray-700 dark:text-gray-300">
                      {typeof ask.quantity === 'number' && !isNaN(ask.quantity) ? ask.quantity.toFixed(4) : '0.0000'}
                    </div>
                    <div className="relative z-10 text-right text-gray-500 dark:text-gray-400 py-2 px-2">
                      {typeof ask.total === 'number' && !isNaN(ask.total) ? ask.total.toFixed(4) : '0.0000'}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <TrendingUp size={16} className="text-gray-400" />
                  </div>
                  No ask data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const OrderBookViewer = memo(OrderBookViewerComponent);