# VOD Service - VM Kubernetes Deployment Guide

## 🚀 VM Deploy (streaming-1 master: 152.66.245.139:2229)

### Előfeltételek
- Kubernetes cluster fut a VM-en
- kubectl konfigurálva
- Docker Hub képek elérhetők (bankilacko11/*)
- Git telepítve

---

## 📋 Deployment Lépések

### 1️⃣ SSH Kapcsolódás a VM-hez
```bash
ssh ubuntu@152.66.245.139 -p 2229
```

### 2️⃣ Repository Klónozása
```bash
git clone https://github.com/bankilacko/onlab_vod-service.git
cd onlab_vod-service
git checkout vm-deploy
```

### 3️⃣ Storage Mappa Létrehozása
```bash
sudo mkdir -p /vod
sudo chmod 777 /vod
```

### 4️⃣ Deploy az Összes Service
```bash
./deploy_all.sh
```

### 5️⃣ Portok Engedélyezése (ha ufw aktív)
```bash
sudo ufw allow 30000/tcp  # Frontend
sudo ufw allow 30080/tcp  # API Gateway
sudo ufw allow 30070/tcp  # NGINX VOD Server (opcionális)
sudo ufw status
```

### 6️⃣ Ellenőrzés
```bash
# Podok állapota
kubectl get pods -o wide

# Service-ek állapota
kubectl get svc

# Logok ellenőrzése (ha szükséges)
kubectl logs <pod-name>
```

---

## 🌐 Hozzáférési Pontok

| Service | URL | Port | Leírás |
|---------|-----|------|--------|
| Frontend | http://172.16.0.29:30000 | 30000 | Angular alkalmazás |
| API Gateway | http://172.16.0.29:30080 | 30080 | Reverse proxy minden backend-hez |
| NGINX VOD | http://172.16.0.29:30070 | 30070 | Video streaming |

### Frontend API hívások:
- User Service: `http://172.16.0.29:30080/user-service/`
- VOD Management: `http://172.16.0.29:30080/vod-management-service/`
- Transcoding: `http://172.16.0.29:30080/transcoding-service/`
- Analytics: `http://172.16.0.29:30080/analytics-service/`

---

## 🔄 Frissítés (később)

### Lokál gépen - Build & Push
```bash
./build_all.sh
```

### VM-en - Pull & Deploy
```bash
cd onlab_vod-service
git pull
./deploy_all.sh

# Vagy gyors restart:
kubectl rollout restart deployment api-gateway
kubectl rollout restart deployment vod-frontend
kubectl rollout restart deployment user-service
```

---

## 🧪 Tesztelés

### 1. Frontend Elérhetőség
```bash
curl http://172.16.0.29:30000
```

### 2. API Gateway Elérhetőség
```bash
curl http://172.16.0.29:30080/user-service/
# Válasz: {"message":"User Service is up and running!"}
```

### 3. Regisztráció Teszt
```bash
curl -X POST http://172.16.0.29:30080/user-service/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 4. Login Teszt
```bash
curl -X POST http://172.16.0.29:30080/user-service/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

---

## 📊 Port Összefoglaló

### NodePort Service-ek
- **30000**: Frontend (vod-frontend)
- **30080**: API Gateway (api-gateway)
- **30070**: NGINX VOD Server (nginx-vod-service)

### ClusterIP Service-ek (belső)
- **80**: user-service
- **80**: vod-management-service
- **80**: transcoding-service
- **80**: analytics-service
- **5432**: database-service (PostgreSQL)
- **7000**: nginx-vod-service (belső port)

---

## 🐛 Troubleshooting

### Podok nem indulnak
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Service nem elérhető
```bash
kubectl get svc
kubectl describe svc <service-name>
```

### Persistent Volume problémák
```bash
kubectl get pv
kubectl get pvc
ls -la /vod
```

### Database kapcsolati problémák
```bash
kubectl logs <pod-name> | grep -i database
kubectl exec -it <database-pod> -- psql -U user -d vod-database
```

### Port forwarding (fejlesztéshez)
```bash
# Frontend
kubectl port-forward svc/vod-frontend 8080:80

# API Gateway
kubectl port-forward svc/api-gateway 5000:80
```

---

## 🔐 Fontos Megjegyzések

1. **Biztonsági figyelmeztetés**: Ez egy development/teszt konfiguráció
   - A jelszavak nincs hashelve (production-ben használj bcrypt-et)
   - CORS minden origin-t engedélyez
   - Nincs HTTPS (production-ben használj Ingress + TLS)

2. **Perzisztens adat**: 
   - A `/vod` mappában tárolt videók megmaradnak pod restart után
   - Az adatbázis `emptyDir` volumet használ (elvész pod restart után)
   - Production-ben használj valódi PV-t az adatbázisnak is!

3. **Skálázhatóság**:
   - Jelenleg minden service 1 replica
   - Szükség esetén növeld a `replicas` számot a deployment YAML-okban

---

## ✅ Ellenőrző Lista

- [ ] VM elérhető SSH-n keresztül
- [ ] Kubernetes cluster fut
- [ ] Repository klónozva és vm-deploy branch kicheckoutolva
- [ ] `/vod` mappa létezik és írható
- [ ] `./deploy_all.sh` lefutott hibák nélkül
- [ ] Portok engedélyezve (30000, 30080)
- [ ] `kubectl get pods` - minden pod Running
- [ ] `kubectl get svc` - minden service létezik
- [ ] Frontend elérhető: http://172.16.0.29:30000
- [ ] API Gateway elérhető: http://172.16.0.29:30080
- [ ] Regisztráció működik
- [ ] Login működik
- [ ] Videó feltöltés működik
- [ ] Videó lejátszás működik

---

🎉 **Sikeres deployment után az alkalmazás használatra kész!**

