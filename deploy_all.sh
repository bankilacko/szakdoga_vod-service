#!/bin/bash
set -e

echo "🚀 VOD alkalmazás teljes Kubernetes deploy indul!"

# Note: PV és PVC manuálisan kell létrehozni, vagy első létrehozásnál használd
# A következő sorok ki vannak kommentezve, mert a PV/PVC már létezik és nem lehet módosítani
# PV_FILE="storage/persistent-volume.yaml"
# PVC_FILE="storage/persistent-volume-claim.yaml"
# if [ -f "$PV_FILE" ]; then
#   echo "💾 Persistent Volume létrehozása..."
#   kubectl apply -f "$PV_FILE"
# fi
# if [ -f "$PVC_FILE" ]; then
#   echo "💾 Persistent Volume Claim létrehozása..."
#   kubectl apply -f "$PVC_FILE"
# fi

# Elsőként az adatbázis deploy
echo "🗄️ Deploying database..."
kubectl apply -f "database/persistent-volume.yaml"
kubectl apply -f "database/persistent-volume-claim.yaml"
kubectl apply -f "database/deployment.yaml"
kubectl apply -f "database/service.yaml"

# Kis várakozás az adatbázis elindulásához
echo "⏳ Várakozás 10 másodpercet az adatbázis indulásához..."
sleep 10

# Többi komponens sorrendben
SERVICES=(
  "storage"
  "user service"
  "video input"
  "transcoding service"
  "vod management service"
  "api-gateway"
  "analytics service"
  "nginx vod server"
  "vod-frontend"
)

for SERVICE in "${SERVICES[@]}"; do
  echo "🚀 Deploying $SERVICE..."
  if [ -f "$SERVICE/deployment.yaml" ]; then
    kubectl apply -f "$SERVICE/deployment.yaml"
  else
    echo "⚠️ $SERVICE/deployment.yaml nem található, kihagyva."
  fi

  if [ -f "$SERVICE/service.yaml" ]; then
    kubectl apply -f "$SERVICE/service.yaml"
  else
    echo "⚠️ $SERVICE/service.yaml nem található, kihagyva."
  fi
done

echo "✅ Minden komponens deployolva!"
kubectl get pods -o wide
