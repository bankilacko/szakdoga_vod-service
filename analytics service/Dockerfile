# Alap image
FROM python:3.10-slim

# Munkakönyvtár létrehozása
WORKDIR /app

# Függőségek másolása és telepítése
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Alkalmazás fájlok másolása
COPY . .

# Port exponálása (pl. 5000)
EXPOSE 5000

# Az alkalmazás indítása
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
