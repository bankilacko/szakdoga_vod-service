#!/bin/bash
set -e

echo "🛑 VOD alkalmazás leállítása és erőforrások törlése..."

# Minden pod, service, deployment törlése
kubectl delete all --all --ignore-not-found

# Database és Storage PV/PVC megőrzése (adatbázis és videók megmaradnak)
echo "💾 Database és Storage PersistentVolume/PersistentVolumeClaim megőrzése (adatbázis és videók mentése)..."

echo "✅ Minden erőforrás törölve."
