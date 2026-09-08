FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for OpenCV and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Hugging Face Spaces uses 7860 by default; Render/cloud allows custom PORT
ENV PORT=7860
ENV HOST=0.0.0.0
EXPOSE 7860

CMD ["python", "api_server.py"]
