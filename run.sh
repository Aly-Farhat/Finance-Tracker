#!/bin/bash

# Cross-platform run script for Finance Tracker

echo "🚀 Starting Finance Tracker..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    echo ""
fi

echo "✨ Starting application..."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev

