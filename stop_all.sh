#!/bin/bash
set -e

echo "🛑 VOD alkalmazás leállítása és erőforrások törlése..."

# Minden pod, service, deployment törlése
kubectl delete all --all --ignore-not-found

# Persistent Volume Claim törlése
if kubectl get pvc >/dev/null 2>&1; then
  echo "💾 PersistentVolumeClaim törlése..."
  kubectl delete -f storage/persistent-volume-claim.yaml --ignore-not-found
fi

# Persistent Volume törlése
if kubectl get pv >/dev/null 2>&1; then
  echo "💾 PersistentVolume törlése..."
  kubectl delete -f storage/persistent-volume.yaml --ignore-not-found
fi

echo "✅ Minden erőforrás törölve."
