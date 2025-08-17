#!/bin/bash

# Quick Local Test Launcher for ppPage
# This script starts the server and opens the GitHub simulation

echo "🚀 Starting ppPage Local Test Environment..."
echo ""

# Check if port 9000 is already in use
if lsof -Pi :9000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server already running on port 9000"
else
    echo "🔧 Starting HTTP server on port 9000..."
    # Start Python HTTP server in background
    python3 -m http.server 9000 > server.log 2>&1 &
    SERVER_PID=$!
    echo "📝 Server PID: $SERVER_PID"
    
    # Wait a moment for server to start
    sleep 2
fi

echo ""
echo "🌐 GitHub Pages Simulation Ready!"
echo ""
echo "📋 Quick Access URLs:"
echo "   Main Site: http://localhost:9000/"
echo "   Simulation: http://localhost:9000/github-simulation.html"
echo "   Tests: http://localhost:9000/taskbar-final-test.html"
echo ""
echo "💡 Bookmark this for instant testing:"
echo "   http://localhost:9000/github-simulation.html"
echo ""
echo "🔧 To stop the server:"
echo "   Press Ctrl+C or run: pkill -f 'python3 -m http.server 9000'"
echo ""

# Try to open the simulation page
if command -v open >/dev/null 2>&1; then
    echo "🌍 Opening GitHub simulation in browser..."
    open "http://localhost:9000/github-simulation.html"
elif command -v xdg-open >/dev/null 2>&1; then
    echo "🌍 Opening GitHub simulation in browser..."
    xdg-open "http://localhost:9000/github-simulation.html"
else
    echo "📌 Manually open: http://localhost:9000/github-simulation.html"
fi

echo ""
echo "✨ Ready to test! Make your changes and refresh the browser."
