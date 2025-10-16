#!/bin/bash
set -e

echo "🛑 VOD alkalmazás leállítása és erőforrások törlése..."

# Minden pod, service, deployment törlése
kubectl delete all --all --ignore-not-found

# Database PVC és PV törlése (adatbázis adatok elvesznek)
if kubectl get pvc database-storage-claim >/dev/null 2>&1; then
  echo "🗄️ Database PersistentVolumeClaim törlése..."
  kubectl delete -f database/persistent-volume-claim.yaml --ignore-not-found
fi

if kubectl get pv database-storage >/dev/null 2>&1; then
  echo "🗄️ Database PersistentVolume törlése..."
  kubectl delete -f database/persistent-volume.yaml --ignore-not-found
fi

# Storage PV és PVC megőrzése (videók megmaradnak)
echo "💾 Storage PersistentVolume és PersistentVolumeClaim megőrzése (videók mentése)..."

echo "✅ Minden erőforrás törölve."
