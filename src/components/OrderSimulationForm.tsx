import { useState } from 'react';
import { SimulatedOrder } from '@/types/orderbook';
import { Calculator } from 'lucide-react';

interface OrderSimulationFormProps {
  selectedVenue: string;
  symbol: string;
  onOrderSimulation: (order: SimulatedOrder) => void;
}

export function OrderSimulationForm({
  selectedVenue,
  symbol,
  onOrderSimulation
}: OrderSimulationFormProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [delay, setDelay] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || (orderType === 'limit' && !price)) {
      return;
    }

    const order: SimulatedOrder = {
      id: '',
      venue: selectedVenue,
      symbol,
      side,
      type: orderType,
      price: orderType === 'limit' ? parseFloat(price) : undefined,
      quantity: parseFloat(quantity),
      timestamp: 0
    };

    // Apply delay before executing the order simulation
    setTimeout(() => {
      onOrderSimulation(order);
    }, delay * 1000);

    setPrice('');
    setQuantity('');
  };

  const resetForm = () => {
    setPrice('');
    setQuantity('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Title Line */}
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={16} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Order Simulation</h3>
      </div>

      {/* Controls Line */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Type:
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setOrderType('market')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                orderType === 'market'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType('limit')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                orderType === 'limit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Side:
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                side === 'buy'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                side === 'sell'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {orderType === 'limit' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Price:
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Quantity:
          </label>
          <input
            type="number"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.000"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Delay:
          </label>
          <div className="flex gap-1">
            {[0, 5, 10, 15].map((delayOption) => (
              <button
                key={delayOption}
                type="button"
                onClick={() => setDelay(delayOption)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  delay === delayOption
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {delayOption}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded text-sm transition-colors"
          >
            Simulate Order
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium py-1.5 px-3 rounded text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}