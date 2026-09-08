"""
app.py - Free Hugging Face Spaces Entry Point (Gradio SDK)
This allows running the entire FastAPI backend on Hugging Face's 100% FREE Tier
(16 GB RAM) by using the Gradio SDK instead of the paid Docker SDK.
"""

import gradio as gr
from api_server import app as fastapi_app

# Interactive Status Landing Page for Hugging Face Space
with gr.Blocks(title="Agri-NEX AI Backend API") as demo:
    gr.Markdown("# 🌾 Agri-NEX AI Engine & Advisory Service")
    gr.Markdown(
        """
        Welcome to the **Agri-NEX AI Production Backend API**.
        
        This space runs the deep learning vision inference models (`diseases_model.keras` & `pests_model.keras`), 
        real-time environmental telemetry, and the Groq LLM Agronomist Advisor.
        
        ### 🚀 Available Endpoints for Frontend:
        - **Swagger Interactive API Documentation:** [`/docs`](/docs)
        - **API Health Check:** [`/health`](/health)
        - **Crop Vision Diagnosis:** `POST /api/crop-analysis`
        - **Diagnosis History:** `GET /api/history`
        - **Agronomist AI Chat:** `POST /api/chat`
        """
    )

# Mount the FastAPI backend onto the Gradio app so all /api endpoints work seamlessly
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
