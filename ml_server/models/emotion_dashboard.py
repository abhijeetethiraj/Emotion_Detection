"""
Emotion Detection WebSocket Server - Fixed for Render Deployment
"""

import asyncio
import websockets
import cv2
import numpy as np
try:
    from tensorflow.keras.models import load_model
except ImportError:
    from keras.models import load_model
import base64
import json
from PIL import Image
from io import BytesIO
import requests
from datetime import datetime
from pathlib import Path
import os
from aiohttp import web  # ✅ Added

# ========================================
# CONFIGURATION
# ========================================
WEBSOCKET_PORT = int(os.environ.get('PORT', 8765))
NODE_API = "https://emotion-detection2.onrender.com/api/emotions/save"

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'models' / 'engagement_cnn.h5'
CLASS_LABELS = ['Bored', 'Confused', 'Interested']

# ========================================
# LOAD MODEL
# ========================================
print("Loading emotion detection model...")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_PATHS = [
    str(MODEL_PATH),
    os.path.join(SCRIPT_DIR, 'models', 'engagement_cnn.h5'),
    os.path.join(SCRIPT_DIR, 'engagement_cnn.h5'),
]

model_path = None
for path in POSSIBLE_PATHS:
    if os.path.exists(path):
        model_path = path
        print(f"✅ Found model at: {path}")
        break

if model_path is None:
    print("❌ ERROR: Model file not found!")
    exit(1)

engagement_model = load_model(model_path)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
print("✅ Model loaded successfully")

# ========================================
# DETECTION FUNCTION
# ========================================
def detect_emotion(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

        if len(faces) == 0:
            return {"emotion": "N/A", "confidence": 0, "probabilities": {}, "face_detected": False}

        (x, y, w, h) = max(faces, key=lambda f: f[2]*f[3])
        roi = gray[y:y+h, x:x+w]
        roi = cv2.resize(roi, (48, 48)) / 255.0
        roi = np.reshape(roi, (1, 48, 48, 1))
        preds = engagement_model.predict(roi, verbose=0)
        idx = np.argmax(preds[0])
        confidence = float(preds[0][idx] * 100)
        emotion = CLASS_LABELS[idx]
        probs = {label: round(float(p * 100), 2) for label, p in zip(CLASS_LABELS, preds[0])}
        return {"emotion": emotion, "confidence": confidence, "probabilities": probs, "face_detected": True}

    except Exception as e:
        print("❌ Error:", e)
        return {"emotion": "Error", "confidence": 0, "probabilities": {}, "face_detected": False, "error": str(e)}

# ========================================
# SAVE TO NODE BACKEND
# ========================================
def save_to_nodejs(user_id, email, emotion_data):
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
            print(f"✅ Saved: {emotion_data['emotion']} ({emotion_data['confidence']:.1f}%)")
        else:
            print(f"❌ Node.js error: {res.status_code} - {res.text}")
    except Exception as e:
        print("❌ Node.js connection error:", e)

# ========================================
# WEBSOCKET HANDLER
# ========================================
async def handle_client(ws):
    client = ws.remote_address[0] if ws.remote_address else "unknown"
    print(f"✅ Client connected: {client}")
    try:
        async for msg in ws:
            try:
                data = json.loads(msg)
                user_id, email, img = data.get("userId"), data.get("email"), data.get("image")
                if not img:
                    await ws.send(json.dumps({"success": False, "error": "Missing image"}))
                    continue

                result = detect_emotion(img)
                if result["face_detected"]:
                    save_to_nodejs(user_id, email, result)

                await ws.send(json.dumps({
                    "success": True,
                    **result,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except Exception as e:
                await ws.send(json.dumps({"success": False, "error": str(e)}))
    except websockets.exceptions.ConnectionClosed:
        print(f"⚠️ Disconnected: {client}")

# ========================================
# HTTP SERVER (for Render health checks)
# ========================================
async def handle_health(request):
    return web.Response(text="✅ Python Emotion Server is running!")

async def start_http_server():
    app = web.Application()
    app.add_routes([web.get('/', handle_health), web.get('/health', handle_health)])
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', WEBSOCKET_PORT)
    await site.start()

# ========================================
# MAIN SERVER START
# ========================================
async def main():
    print("=" * 60)
    print("  Emotion Detection WebSocket Server (Render Ready)")
    print("=" * 60)
    print(f"🌐 HTTP Health: http://0.0.0.0:{WEBSOCKET_PORT}/health")

    await start_http_server()

    ws_port = WEBSOCKET_PORT + 1
    print(f"📡 WebSocket listening on ws://0.0.0.0:{ws_port}")
    await websockets.serve(handle_client, "0.0.0.0", ws_port)

    await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print("❌ Fatal server error:", e)
