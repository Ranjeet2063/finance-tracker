#!/bin/bash
# Production deployment script
set -e

echo "Starting deployment..."

# Load env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Pull latest
git pull origin main

# Build and restart
docker-compose down
docker-compose pull
docker-compose up -d --build

# Cleanup old images
docker image prune -f

echo "Deployment complete!"
echo "API: http://localhost:5000"
echo "Frontend: http://localhost:3000"
