from fastapi import FastAPI

app = FastAPI()

# Egyszerű "health check" endpoint
@app.get("/")
def read_root():
    return {"message": "Analytics Service is up and running!"}