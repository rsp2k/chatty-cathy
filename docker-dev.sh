#!/bin/bash

echo "🚀 Cool PWA Docker Development Setup"
echo "===================================="
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check if docker-compose is available
check_compose() {
    if command -v docker-compose > /dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        echo "❌ Neither docker-compose nor 'docker compose' is available"
        exit 1
    fi
    echo "✅ Using: $COMPOSE_CMD"
}

# Main execution
main() {
    check_docker
    check_compose
    
    echo ""
    echo "🏗️  Building and starting your PWA..."
    
    # Build and start the containers
    $COMPOSE_CMD up --build
}

# Handle Ctrl+C gracefully
cleanup() {
    echo ""
    echo "🛑 Shutting down containers..."
    $COMPOSE_CMD down
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check command line arguments
case "${1:-}" in
    "build")
        check_docker
        check_compose
        echo "🏗️  Building Docker images..."
        $COMPOSE_CMD build --no-cache
        ;;
    "down")
        check_docker
        check_compose
        echo "🛑 Stopping containers..."
        $COMPOSE_CMD down
        ;;
    "logs")
        check_docker
        check_compose
        echo "📋 Showing logs..."
        $COMPOSE_CMD logs -f
        ;;
    "shell")
        check_docker
        check_compose
        echo "🐚 Opening shell in container..."
        $COMPOSE_CMD exec pwa-app sh
        ;;
    *)
        main
        ;;
esac
