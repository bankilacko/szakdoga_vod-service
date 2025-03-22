# Python alapú image
FROM python:3.10-slim

# Szükséges csomagok telepítése
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Könyvtárak telepítése
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Alkalmazás másolása
COPY . /app
WORKDIR /app

# Port megnyitása
EXPOSE 5000

# Indítás
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]