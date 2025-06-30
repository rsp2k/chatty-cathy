# 🐳 Docker Development Guide

Your PWA is now fully containerized! Here's everything you need to know:

## 🚀 Quick Start

```bash
# Start development with Docker
npm run docker:dev
# OR
./docker-dev.sh

# Your app will be available at: http://localhost:4321
```

## 📋 Available Docker Commands

### Development
```bash
npm run docker:dev      # Start development environment (hot reload)
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View live logs
npm run docker:shell    # Open shell in container
```

### Build & Management
```bash
npm run docker:build    # Build Docker images
npm run docker:clean    # Clean up Docker resources
```

### Advanced
```bash
./docker-dev.sh build   # Rebuild from scratch
./docker-dev.sh down    # Stop everything
./docker-dev.sh logs    # Follow logs
./docker-dev.sh shell   # Interactive shell
```

## 🔧 What's Included

- **Node.js 20** - Latest version supporting Astro 5
- **Hot Reload** - Your code changes trigger automatic rebuilds
- **Port Mapping** - Container port 4321 → Host port 4321
- **Volume Mounts** - Live code editing without rebuilds
- **Environment Variables** - Your .env file is automatically loaded

## 🌐 Development Workflow

1. **Start Development:**
   ```bash
   npm run docker:dev
   ```

2. **Edit Code:**
   - Changes to `/src/` files trigger hot reload
   - TypeScript compilation happens in real-time
   - Tailwind CSS updates automatically

3. **Test Notifications:**
   ```bash
   # From your host machine
   curl -X POST http://localhost:4321/api/send-notification \
     -H "Content-Type: application/json" \
     -d '{"title":"Docker Test","body":"PWA running in container!"}'
   ```

4. **Debug Issues:**
   ```bash
   npm run docker:logs    # View container logs
   npm run docker:shell   # Debug inside container
   ```

## 📱 PWA Features in Docker

All PWA features work perfectly in the containerized environment:

- ✅ **Service Worker** - Registers and works normally
- ✅ **Push Notifications** - VAPID keys loaded from .env
- ✅ **Offline Support** - Cache strategies work as expected
- ✅ **App Installation** - PWA can be installed on desktop/mobile

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check if Docker is running
docker info

# Rebuild everything
npm run docker:build
npm run docker:dev
```

### Port Already in Use
```bash
# Stop any existing containers
npm run docker:down

# Or change port in docker-compose.yml
# ports: "4322:4321"  # Use different host port
```

### Code Changes Not Updating
```bash
# Check volume mounts
docker volume ls

# Restart development
npm run docker:down
npm run docker:dev
```

### Environment Variables Not Loading
```bash
# Check .env file exists
ls -la .env

# Verify variables in container
npm run docker:shell
printenv | grep VAPID
```

## 🚀 Production Deployment

For production, you can build optimized images:

```bash
# Build production image
docker build -t cool-pwa-production .

# Run production container
docker run -p 80:4321 \
  -e VAPID_PUBLIC_KEY="your_key" \
  -e VAPID_PRIVATE_KEY="your_private_key" \
  cool-pwa-production
```

## 🎯 Next Steps

Your containerized PWA is ready! Try:

1. 🔔 **Enable notifications** in your browser
2. 🧪 **Send test notifications** via the API
3. 📱 **Install the PWA** from your browser
4. 🚀 **Deploy to production** with Docker

---

**Pro Tip:** Use VS Code with the Remote-Containers extension to develop directly inside the container! 🔥
