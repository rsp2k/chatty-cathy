#!/bin/bash

echo "🚀 Cool PWA Quick Start Script"
echo "============================="
echo ""

# Check if we're in the right directory
if [ ! -f "astro.config.mjs" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Checking configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  Missing .env file. Generating VAPID keys..."
    node generate-vapid-keys.js
else
    echo "✅ .env file exists"
fi

echo ""
echo "🎯 Project ready! Here's what to do next:"
echo ""
echo "1. 🚀 Start development server:"
echo "   npm run dev"
echo ""
echo "2. 🌐 Open your browser to:"
echo "   http://localhost:4321"
echo ""
echo "3. 🔔 Click 'Enable Push Notifications'"
echo ""
echo "4. 🧪 Send test notifications!"
echo ""
echo "📚 For more info, check out:"
echo "   - README.md"
echo "   - PROJECT_STRUCTURE.md"
echo ""
echo "🎉 Have fun building with your PWA!"
