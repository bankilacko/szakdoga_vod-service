# Alap Python image
FROM python:3.10-slim

# Függőségek másolása és telepítés
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Kód másolása
COPY . ./app

# Mappa létrehozása
WORKDIR /app

# Port megadása
EXPOSE 5000

# Indítás (FastAPI esetén)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]




