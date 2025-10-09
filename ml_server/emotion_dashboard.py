import asyncio
import websockets
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import base64
import json
from PIL import Image
from io import BytesIO
from datetime import datetime, timezone
from pathlib import Path
import os
import requests

# ========================================
# CONFIGURATION
# ========================================
PORT = int(os.environ.get("PORT", 8765))
NODE_API = "https://emotion-detection2.onrender.com/api/emotions/save"

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "engagement_cnn.h5"
CLASS_LABELS = ["Bored", "Confused", "Interested"]

# ========================================
# LOAD MODEL
# ========================================
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"❌ Model not found at {MODEL_PATH}")

print(f"✅ Loading model from {MODEL_PATH} ...")
engagement_model = load_model(MODEL_PATH)
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
print("✅ Model loaded successfully!")

# ========================================
# EMOTION DETECTION FUNCTION
# ========================================
def detect_emotion(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) == 0:
            return {"emotion": "N/A", "confidence": 0.0, "probabilities": {}, "face_detected": False}

        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        roi_gray = gray[y : y + h, x : x + w]
        roi_resized = cv2.resize(roi_gray, (48, 48))
        roi_normalized = roi_resized / 255.0
        roi_reshaped = np.reshape(roi_normalized, (1, 48, 48, 1))

        predictions = engagement_model.predict(roi_reshaped, verbose=0)
        idx = np.argmax(predictions[0])
        confidence = float(predictions[0][idx] * 100)
        emotion = CLASS_LABELS[idx]
        probabilities = {label: round(float(prob * 100), 2) for label, prob in zip(CLASS_LABELS, predictions[0])}

        return {"emotion": emotion, "confidence": confidence, "probabilities": probabilities, "face_detected": True}
    except Exception as e:
        return {"emotion": "Error", "confidence": 0.0, "probabilities": {}, "face_detected": False, "error": str(e)}

# ========================================
# SAVE TO NODE.JS BACKEND
# ========================================
def save_to_nodejs(user_id, email, emotion_data):
    try:
        payload = {
            "userId": user_id,
            "email": email,
            "emotion": emotion_data["emotion"],
            "confidence": emotion_data["confidence"],
            "probabilities": emotion_data["probabilities"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        response = requests.post(NODE_API, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"✅ Saved to Node.js: {emotion_data['emotion']} ({emotion_data['confidence']:.1f}%)")
        else:
            print(f"❌ Node.js error: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to Node.js: {e}")

# ========================================
# WEBSOCKET HANDLER
# ========================================
async def handle_client(websocket):
    client_ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
    print(f"✅ Client connected: {client_ip}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                user_id = data.get("userId")
                email = data.get("email")
                image_data = data.get("image")

                if not (user_id or email):
                    await websocket.send(json.dumps({"success": False, "error": "Missing userId or email"}))
                    continue
                if not image_data:
                    await websocket.send(json.dumps({"success": False, "error": "Missing image data"}))
                    continue

                emotion_result = detect_emotion(image_data)
                if emotion_result["face_detected"]:
                    save_to_nodejs(user_id, email, emotion_result)

                response = {
                    "success": True,
                    "emotion": emotion_result["emotion"],
                    "confidence": round(emotion_result["confidence"], 2),
                    "probabilities": emotion_result["probabilities"],
                    "face_detected": emotion_result["face_detected"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                await websocket.send(json.dumps(response))
            except Exception as e:
                await websocket.send(json.dumps({"success": False, "error": str(e)}))
    except websockets.ConnectionClosed:
        print(f"⚠️ Client disconnected: {client_ip}")

# ========================================
# WebSocket Server Only
# ========================================
async def main():
    print(f"🌐 Starting WebSocket server on port {PORT}")
    async with websockets.serve(handle_client, "0.0.0.0", PORT):
        print(f"✅ WebSocket server running on ws://0.0.0.0:{PORT}")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("⛔ Server stopped by user")