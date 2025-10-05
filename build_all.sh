#!/bin/bash
set -e

# ===== Állítható értékek =====
DOCKER_USERNAME="bankilacko11"
TAG="latest"

# ===== Mappa -> Image név párosok =====
declare -A SERVICES=(
  ["vod management service"]="vod-management-service"
  ["vod-frontend"]="vod-frontend"
  ["transcoding service"]="transcoding-service"
  ["analytics service"]="analytics-service"
  ["user service"]="user-service"
  ["api-gateway"]="api-gateway"
  ["nginx vod server"]="nginx-vod"
)

echo "🐳 Docker image-ek buildelése és pusholása a(z) '$DOCKER_USERNAME' Docker Hub felhasználóhoz..."
echo "------------------------------------------------------------------------"

# Bejelentkezés a Docker Hubba (ha még nem vagy)
docker login

# Végigmegyünk minden komponensen
for DIR in "${!SERVICES[@]}"; do
  IMAGE_NAME="${DOCKER_USERNAME}/${SERVICES[$DIR]}:${TAG}"

  echo "🚧 Build és push: $DIR → $IMAGE_NAME"

  if [ -d "$DIR" ] && [ -f "$DIR/Dockerfile" ]; then
    cd "$DIR"
    docker build -t "$IMAGE_NAME" .
    docker push "$IMAGE_NAME"
    cd ..
    echo "✅ $DIR sikeresen buildelve és pusholva!"
  else
    echo "⚠️ Kihagyva: $DIR (nem található Dockerfile vagy mappa)"
  fi

  echo "------------------------------------------------------------------------"
done

echo "🎉 Minden image sikeresen buildelve és feltöltve a Docker Hubra!"
