# Installation Guide

## Prerequisites

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- Modern web browser with WebSocket support

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Akhilesh-max/orderbook-viewer.git
   cd orderbook-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Setup

No additional environment variables are required for basic functionality. The application connects directly to exchange WebSocket APIs.

## Supported Exchanges

- **OKX** - Real-time WebSocket connection
- **Bybit** - Real-time WebSocket connection  
- **Deribit** - Real-time WebSocket connection

## Troubleshooting

### Common Issues

1. **WebSocket Connection Errors**
   - Check your internet connection
   - Ensure firewall isn't blocking WebSocket connections
   - Try refreshing the page

2. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version: `node --version`

3. **Port Already in Use**
   - Kill process on port 3000: `lsof -ti:3000 | xargs kill -9`
   - Or use different port: `npm run dev -- -p 3001`

## Development Tools

- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Next.js** for React framework