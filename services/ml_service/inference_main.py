from fastapi import FastAPI
from inference_router import router as inference_router

app = FastAPI()
app.include_router(inference_router)
