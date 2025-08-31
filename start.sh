#!/bin/bash

# 🚀 MyMoney Platform Startup Script
# This script sets up the environment and starts the development server

set -e  # Exit on any error

echo "🏦 Starting MyMoney Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the MyMoney project root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Creating from template..."
    
    cat > .env.local << 'EOF'
# BigQuery Configuration
GOOGLE_CLOUD_PROJECT_ID=mymoney-470619
GOOGLE_CLOUD_DATASET=mymoney
GOOGLE_APPLICATION_CREDENTIALS=./mymoney-470619-2f22e813a9d7.json
GOOGLE_CLOUD_LOCATION=US

# OpenAI API Key for GPT-5 statement parsing
OPENAI_API_KEY=your_openai_api_key_here

# App Security
VAULT_PASSCODE=demo_passcode_123

# Server Configuration
PORT=7777
NEXT_PUBLIC_API_URL=http://localhost:7777
EOF
    
    print_warning "Please update .env.local with your actual API keys and configuration"
    print_warning "Press Enter to continue or Ctrl+C to exit and configure first..."
    read -r
fi

# Check if service account key exists
if [ ! -f "mymoney-470619-2f22e813a9d7.json" ]; then
    print_error "BigQuery service account key file not found!"
    print_error "Please place your service account key file in the project root"
    print_error "File should be named: mymoney-470619-2f22e813a9d7.json"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first:"
    print_error "npm install -g pnpm"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed successfully"
fi

# Set environment variables
print_status "Setting up environment variables..."
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/mymoney-470619-2f22e813a9d7.json"
export GOOGLE_CLOUD_PROJECT_ID="mymoney-470619"
export GOOGLE_CLOUD_DATASET="mymoney"
export GOOGLE_CLOUD_LOCATION="US"

# Verify BigQuery connection
print_status "Testing BigQuery connection..."
if pnpm run db:init > /dev/null 2>&1; then
    print_success "BigQuery connection verified"
else
    print_warning "BigQuery connection test failed, but continuing..."
fi

# Check if port 7777 is available
if lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 7777 is already in use. Stopping existing process..."
    pkill -f "next dev" || true
    sleep 2
fi

# Start the development server
print_status "Starting development server on port 7777..."
print_success "Server will be available at: http://localhost:7777"
echo ""

# Start the server in the background
pnpm run dev &
SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down server..."
    kill $SERVER_PID 2>/dev/null || true
    print_success "Server stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for server to start
print_status "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:7777 > /dev/null 2>&1; then
        print_success "Server is running successfully!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Server failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Show server status
echo ""
print_success "🎉 MyMoney Platform is now running!"
echo ""
echo "📱 Dashboard: http://localhost:7777"
echo "🔧 API Base: http://localhost:7777/api"
echo "📊 Institutions: http://localhost:7777/api/institutions"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep the script running and show server logs
wait $SERVER_PID
