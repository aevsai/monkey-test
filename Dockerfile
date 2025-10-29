FROM python:3.11-slim

# Set metadata
LABEL maintainer="MonkeyTest Contributors"
LABEL description="AI-powered browser testing with Browser Use"
LABEL version="1.0.0"

# Set working directory
WORKDIR /action

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY src/ ./src/

# Set the entrypoint
ENTRYPOINT ["python", "/action/src/run_tests.py"]
