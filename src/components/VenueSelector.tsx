import { Venue } from '@/types/orderbook';
import { Wifi, WifiOff } from 'lucide-react';

interface VenueSelectorProps {
  venues: Venue[];
  selectedVenue: string;
  onVenueChange: (venueId: string) => void;
  isConnected: boolean;
}

export function VenueSelector({
  venues,
  selectedVenue,
  onVenueChange,
  isConnected
}: VenueSelectorProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Exchange */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Exchange:
          </label>
          <div className="flex gap-1">
            {venues.map((venue) => (
              <button
                key={venue.id}
                onClick={() => onVenueChange(venue.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedVenue === venue.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {venue.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pair */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pair:
          </span>
          <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border">
            BTC-USDT
          </span>
        </div>
      </div>

      {/* Live Indicator - Right Aligned */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Wifi size={14} />
            <span className="text-sm font-medium">Live</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <WifiOff size={14} />
            <span className="text-sm font-medium">Offline</span>
          </div>
        )}
      </div>
    </div>
  );
}