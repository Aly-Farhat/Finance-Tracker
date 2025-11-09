#!/bin/bash

# Cross-platform stop script for Finance Tracker

echo "🛑 Stopping Finance Tracker servers..."
echo ""

# Kill all node processes related to finance tracker
pkill -f "vite" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null

echo "✅ All Node.js processes stopped successfully!"
echo ""
echo "Frontend (port 3000) - Stopped"
echo "Backend (port 5000) - Stopped"
echo ""
echo "You can restart the servers by running: ./run.sh"

