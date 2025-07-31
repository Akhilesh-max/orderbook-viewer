import { useMemo } from 'react';
import { SimulatedOrder, MarketData } from '@/types/orderbook';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface TradesViewerProps {
  simulatedOrders: SimulatedOrder[];
  onClearTrades: () => void;
  marketData?: MarketData | null;
}

export function TradesViewer({ simulatedOrders, onClearTrades, marketData }: TradesViewerProps) {
  const sortedOrders = useMemo(() => {
    return [...simulatedOrders].sort((a, b) => b.timestamp - a.timestamp);
  }, [simulatedOrders]);

  if (sortedOrders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Trades
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trades executed yet</p>
          <p className="text-xs mt-1">Market orders will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Orders
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sortedOrders.length} order{sortedOrders.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearTrades}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {sortedOrders.map((order) => {
            const displayPrice = order.type === 'limit' && order.price ? order.price : 0;
            const value = displayPrice * order.quantity;
            
            return (
              <div
                key={order.id}
                className={`rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-3 ${
                  order.side === 'buy' 
                    ? 'border-green-500 bg-green-50/20 dark:bg-green-900/5' 
                    : 'border-red-500 bg-red-50/20 dark:bg-red-900/5'
                } mb-3 p-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {order.side === 'buy' ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${
                      order.side === 'buy' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {order.side.toUpperCase()} {order.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(order.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    {order.timing > 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                        {order.timing}s delay
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-mono text-sm font-semibold ${
                      order.side === 'buy' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {order.type === 'market' ? 'MARKET' : `$${displayPrice.toFixed(2)}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {order.quantity.toFixed(4)} {order.type === 'limit' && value > 0 ? `• $${value.toFixed(2)}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}