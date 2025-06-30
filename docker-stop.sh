#!/bin/bash

echo "🛑 Stopping Cool PWA Docker Environment"
echo "======================================="

# Stop and remove containers
docker-compose down

# Optional: Remove unused Docker resources
read -p "🧹 Clean up unused Docker resources? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Cleanup complete!"
fi

echo "👋 Development environment stopped!"
