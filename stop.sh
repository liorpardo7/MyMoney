#!/bin/bash

# 🛑 MyMoney Platform Stop Script
# This script gracefully stops all running MyMoney servers

echo "🛑 Stopping MyMoney Platform..."

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

# Stop Next.js development server
print_status "Stopping Next.js development server..."
pkill -f "next dev" || print_warning "No development server found"

# Stop Next.js production server
print_status "Stopping Next.js production server..."
pkill -f "next start" || print_warning "No production server found"

# Stop any other Node.js processes on port 7777
print_status "Checking for processes on port 7777..."
if lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 7777 is still in use. Force stopping..."
    lsof -Pi :7777 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

# Wait a moment for processes to stop
sleep 2

# Verify port is free
if ! lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "Port 7777 is now free"
else
    print_warning "Port 7777 may still be in use"
fi

print_success "🎉 MyMoney Platform stopped successfully!"
