# Smart POS — Ollama Setup Guide

Run AI features **completely free** using Ollama, a local LLM runtime. No API keys, no usage costs, no data leaving your server.

---

## Table of Contents

- [What is Ollama?](#what-is-ollama)
- [Installation](#installation)
- [Pull the llama2 Model](#pull-the-llama2-model)
- [Configure Smart POS to Use Ollama](#configure-smart-pos-to-use-ollama)
- [Testing the Setup](#testing-the-setup)
- [Supported Models](#supported-models)
- [Performance Expectations](#performance-expectations)
- [Troubleshooting](#troubleshooting)

---

## What is Ollama?

[Ollama](https://ollama.ai) is an open-source tool that runs large language models locally. Smart POS can route all AI inference (demand forecasting, customer segmentation, price recommendations, message generation) to a local Ollama instance instead of the OpenAI API.

**Benefits:**
- ✅ Zero cost — no per-token pricing
- ✅ Privacy — no data leaves your server
- ✅ Offline capable — works without internet
- ✅ No rate limits

**Trade-offs:**
- ⚠️ Requires a capable machine (see [Performance Expectations](#performance-expectations))
- ⚠️ Response quality depends on the model chosen
- ⚠️ First request takes longer (model loading)

---

## Installation

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

Ollama installs as a systemd service and starts automatically.

```bash
# Verify it's running
ollama --version
systemctl status ollama
```

### macOS

```bash
# Option 1: Homebrew
brew install ollama
brew services start ollama

# Option 2: Download the app
# Visit https://ollama.ai/download and download Ollama.app
# Drag to Applications and launch
```

### Windows

1. Download the installer from **https://ollama.ai/download**
2. Run `OllamaSetup.exe`
3. Ollama starts automatically in the system tray

### Docker

```bash
# CPU only
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

---

## Pull the llama2 Model

After installing Ollama, download the `llama2` model (the default for Smart POS):

```bash
ollama pull llama2
```

This downloads approximately **3.8 GB** for the 7B parameter model. Progress is shown in the terminal.

```
pulling manifest
pulling 8934d96d3f08... 100% ▕████████████████▏ 3.8 GB
pulling 8c17c2ebb0ea... 100% ▕████████████████▏ 7.0 KB
verifying sha256 digest
writing manifest
success
```

### Verify the download

```bash
# List available models
ollama list

# Test a quick inference
ollama run llama2 "Say hello in one sentence"
```

---

## Configure Smart POS to Use Ollama

Edit `backend/.env`:

```env
# Disable OpenAI
# OPENAI_API_KEY=sk-...   ← comment this out or leave blank

# Enable Ollama
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

Restart the backend:

```bash
# Development
cd backend && npm run dev

# Docker
docker compose restart backend
```

### Docker Compose with Ollama

If you want to run Ollama in Docker alongside Smart POS, add this service to `docker-compose.yml`:

```yaml
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # For NVIDIA GPU support:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  ollama_data:
```

Then update `OLLAMA_BASE_URL` in the backend environment:

```yaml
OLLAMA_BASE_URL: http://ollama:11434
```

After starting: `docker compose exec ollama ollama pull llama2`

---

## Testing the Setup

### 1. Verify Ollama is reachable

```bash
curl http://localhost:11434/api/tags
```

Expected response:
```json
{
  "models": [
    { "name": "llama2:latest", "size": 3826793472, ... }
  ]
}
```

### 2. Test a raw inference

```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama2",
    "prompt": "Return a JSON array with one item: {\"id\": \"test\", \"segment\": \"VIP\"}",
    "stream": false
  }'
```

### 3. Test via Smart POS API

```bash
# Log in first
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shop.com","password":"password123"}' \
  | jq -r '.data.token')

# Call the demand forecast endpoint
curl -X POST http://localhost:3001/api/ai/demand-forecast \
  -H "Authorization: Bearer $TOKEN"
```

---

## Supported Models

Any Ollama-compatible model that can follow JSON instructions works with Smart POS. The system sends structured prompts requesting JSON array outputs.

| Model | Pull Command | Size | Quality | Speed |
|-------|-------------|------|---------|-------|
| **llama2** (default) | `ollama pull llama2` | 3.8 GB | Good | Medium |
| llama2:13b | `ollama pull llama2:13b` | 7.4 GB | Better | Slower |
| mistral | `ollama pull mistral` | 4.1 GB | Excellent | Fast |
| mixtral | `ollama pull mixtral` | 26 GB | Best | Slow |
| phi3 | `ollama pull phi3` | 2.2 GB | Good | Very Fast |
| gemma:2b | `ollama pull gemma:2b` | 1.4 GB | Fair | Fastest |

### Recommendations by use case

| Use Case | Recommended Model |
|----------|------------------|
| Low-RAM server (< 8 GB) | `gemma:2b` or `phi3` |
| Standard server (8–16 GB RAM) | `llama2` or `mistral` |
| High-end server / GPU (16+ GB) | `llama2:13b` or `mixtral` |
| Best JSON accuracy | `mistral` |

To switch models, update `OLLAMA_MODEL` in `.env` and restart the backend. You do not need to restart Ollama.

```env
OLLAMA_MODEL=mistral
```

---

## Performance Expectations

Inference time depends on your hardware. Smart POS batches up to 50 items per AI call and caches results for 24 hours, so the LLM is only called once per batch per day.

### Approximate inference times (50-item batch)

| Hardware | llama2 7B | mistral 7B |
|----------|-----------|------------|
| MacBook Pro M1 8GB | ~8–15 sec | ~6–12 sec |
| MacBook Pro M2 16GB | ~4–8 sec | ~3–6 sec |
| Linux server, CPU only (8 cores) | ~30–90 sec | ~25–70 sec |
| Linux server + NVIDIA RTX 3080 | ~2–5 sec | ~2–4 sec |
| Linux server + NVIDIA A100 | ~0.5–1 sec | ~0.5–1 sec |

> With 24-hour caching enabled (default), these times are one-time costs per batch run, not per user request.

### Memory requirements

| Model | Minimum RAM | Recommended RAM |
|-------|-------------|----------------|
| gemma:2b | 4 GB | 8 GB |
| phi3 | 4 GB | 8 GB |
| llama2 7B | 8 GB | 16 GB |
| mistral 7B | 8 GB | 16 GB |
| llama2:13B | 16 GB | 32 GB |
| mixtral 8x7B | 48 GB | 64 GB |

---

## Troubleshooting

### "connection refused" when calling Ollama

Ollama is not running or is listening on a different host/port.

```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama manually
ollama serve

# Verify port
curl http://localhost:11434/api/tags
```

### Model not found error

```
Error: model 'llama2' not found
```

Pull the model first:

```bash
ollama pull llama2
```

### Response is not valid JSON

Some smaller models don't reliably follow JSON formatting instructions. The backend will return an empty array in this case (the `parseJsonResponse` function handles malformed output gracefully).

**Solutions:**
1. Use a larger or more instruction-following model: `mistral` is better at JSON than `llama2`
2. The 24-hour cache will re-try on next cache miss

### Ollama is very slow

1. Verify your machine meets the memory requirements above
2. Try a smaller model: `phi3` or `gemma:2b`
3. Enable GPU acceleration (NVIDIA: install CUDA drivers; Apple Silicon: Ollama uses Metal automatically)
4. Increase system RAM or reduce other running processes

### Docker: cannot reach Ollama from backend container

If Ollama is running on the host machine and the backend is in Docker:

```env
# Use host.docker.internal instead of localhost
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

On Linux, you may need:
```yaml
# In docker-compose.yml backend service:
extra_hosts:
  - "host.docker.internal:host-gateway"
```
