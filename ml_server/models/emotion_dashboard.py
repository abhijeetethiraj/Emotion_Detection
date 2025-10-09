# emotion_dashboard_aiohttp.py
"""
Emotion Detection Server (aiohttp) - handles HTTP healthchecks and WebSocket upgrades
"""

import asyncio
import base64
import json
import os
from datetime import datetime
from pathlib import Path
from io import BytesIO

import cv2
import numpy as np
from PIL import Image
import requests

from aiohttp import web

# Try Keras import(s)
try:
    from tensorflow.keras.models import load_model
except Exception:
    from keras.models import load_model

# ----------------------------
# CONFIG
# ----------------------------
PORT = int(os.environ.get("PORT", 8765))          # Render exposes only this port
NODE_API = os.environ.get("NODE_API") or "https://emotion-detection2.onrender.com/api/emotions/save"

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATHS = [
    BASE_DIR / "models" / "engagement_cnn.h5",
    BASE_DIR / "engagement_cnn.h5",
    Path.cwd() / "models" / "engagement_cnn.h5",
]

CLASS_LABELS = ['Bored', 'Confused', 'Interested']

# ----------------------------
# LOAD MODEL
# ----------------------------
print("Loading model...")
model_file = None
for p in MODEL_PATHS:
    if p.exists():
        model_file = str(p)
        print("Found model at:", model_file)
        break

if model_file is None:
    raise SystemExit("❌ engagement_cnn.h5 not found. Place it in models/ or same dir.")

engagement_model = load_model(model_file)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
print("✅ Model loaded")

# ----------------------------
# CPU-bound helper wrappers
# ----------------------------
def detect_emotion_sync(base64_string: str):
    """Synchronous detection — suitable to run in executor."""
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return {"emotion": "N/A", "confidence": 0.0, "probabilities": {}, "face_detected": False}

    (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
    roi = gray[y:y + h, x:x + w]
    roi_resized = cv2.resize(roi, (48, 48)) / 255.0
    roi_reshaped = np.reshape(roi_resized, (1, 48, 48, 1))

    preds = engagement_model.predict(roi_reshaped, verbose=0)
    idx = int(np.argmax(preds[0]))
    confidence = float(preds[0][idx] * 100)
    emotion = CLASS_LABELS[idx]
    probs = {label: round(float(p * 100), 2) for label, p in zip(CLASS_LABELS, preds[0])}

    return {"emotion": emotion, "confidence": confidence, "probabilities": probs, "face_detected": True}

def save_to_nodejs_sync(user_id, email, emotion_data):
    try:
        payload = {
            "userId": user_id,
            "email": email,
            "emotion": emotion_data["emotion"],
            "confidence": emotion_data["confidence"],
            "probabilities": emotion_data["probabilities"],
            "timestamp": datetime.utcnow().isoformat()
        }
        res = requests.post(NODE_API, json=payload, timeout=5)
        if res.status_code == 200:
            print(f"Saved to node: {emotion_data['emotion']} ({emotion_data['confidence']:.1f}%)")
        else:
            print("Node error:", res.status_code, res.text)
    except Exception as e:
        print("Node connection error:", e)

# ----------------------------
# aiohttp handlers
# ----------------------------
async def handle_health(request):
    return web.Response(text="✅ Python Emotion Server running")

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    peer = request.remote
    print("Client connected:", peer)

    loop = asyncio.get_running_loop()

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    user_id = data.get("userId")
                    email = data.get("email")
                    image_data = data.get("image")
                    if not image_data:
                        await ws.send_json({"success": False, "error": "Missing image"})
                        continue

                    # Run heavy work in threadpool so event loop isn't blocked
                    result = await loop.run_in_executor(None, detect_emotion_sync, image_data)

                    if result.get("face_detected"):
                        # fire-and-forget save to nodejs in executor
                        await loop.run_in_executor(None, save_to_nodejs_sync, user_id, email, result)

                    resp = {
                        "success": True,
                        "emotion": result.get("emotion"),
                        "confidence": round(result.get("confidence", 0.0), 2),
                        "probabilities": result.get("probabilities", {}),
                        "face_detected": result.get("face_detected", False),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await ws.send_json(resp)

                except json.JSONDecodeError:
                    await ws.send_json({"success": False, "error": "Invalid JSON"})
                except Exception as e:
                    print("Processing error:", e)
                    await ws.send_json({"success": False, "error": str(e)})

            elif msg.type == web.WSMsgType.ERROR:
                print("WebSocket error:", ws.exception())

    finally:
        print("Connection closed:", peer)
    return ws

# ----------------------------
# App startup
# ----------------------------
def create_app():
    app = web.Application()
    app.router.add_get("/", handle_health)
    app.router.add_get("/health", handle_health)
    app.router.add_get("/ws", websocket_handler)    # WebSocket endpoint is at /ws
    return app

if __name__ == "__main__":
    print("Starting aiohttp server on port", PORT)
    web.run_app(create_app(), host="0.0.0.0", port=PORT)
