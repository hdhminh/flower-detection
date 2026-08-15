from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="🌸 Flower Detection AI API",
    description="Backend service providing flower metadata and OpenRouter LLM insights for AI Flower Detection",
    version="3.0.0"
)

# CORS setup to allow web browser requests from frontend Vite app (e.g. localhost:5173 / localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.flower_router import router as flower_router
app.include_router(flower_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Flower Detection AI v3",
        "endpoints": {
            "flowers_list": "/flower/list",
            "flower_detail": "/flower/{id_or_name}",
            "explain_flower": "POST /flower/explain"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
