# TradeWatch App

A comprehensive global trade intelligence platform that monitors maritime trade disruptions, port activities, and supply chain analytics in real-time.

## Features

- **Global Overview Dashboard**: Real-time monitoring of global trade activities
- **Active Disruptions**: Track and analyze current trade disruptions
- **Impact Analysis**: Assess the impact of disruptions on specific ports
- **Live AIS Feed**: Real-time vessel tracking and maritime intelligence
- **Analytics**: Advanced analytics and reporting capabilities

## Prerequisites

- Node.js 20+ (the app will automatically install this if needed)
- npm (comes with Node.js)

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
./start-app.sh
```

### Option 2: Manual setup
```bash
# Install Node.js 20 using nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Accessing the App

Once the development server is running, open your browser and navigate to:
```
http://localhost:5173
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Technology Stack

- **Frontend**: React 18 with Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom maritime theme

## Project Structure

```
src/
├── api/           # API integrations and entities
├── components/    # Reusable UI components
│   ├── dashboard/ # Dashboard-specific components
│   └── ui/        # Base UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── pages/         # Main application pages
└── utils/         # Utility functions
```

## Development

The app uses a modern React setup with:
- Hot module replacement for fast development
- TypeScript support (configured but not enforced)
- ESLint for code quality
- Tailwind CSS for styling

## Troubleshooting

If you encounter any issues:

1. **Node.js version issues**: Make sure you're using Node.js 20+
2. **Port conflicts**: The app runs on port 5173 by default
3. **Dependencies**: Run `npm install` to ensure all dependencies are installed

## Support

For more information and support, please contact Base44 support at app@base44.com.