"""
Simple Emotion Detection - Sends data to Node.js backend
Run: python emotion_detector.py
"""

import asyncio
import websockets
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import base64
import json
from PIL import Image
from io import BytesIO
import requests
from datetime import datetime
from pathlib import Path

# ========================================
# CONFIGURATION - CHANGE THESE
# ========================================
import os

WEBSOCKET_PORT = 8765
NODE_API = "http://localhost:4000/api/emotions/save"
ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT_DIR / 'models' / 'engagement_cnn.h5'
CLASS_LABELS = ['Bored', 'Confused', 'Interested']

# ========================================
# LOAD ML MODEL
# ========================================
print("Loading emotion detection model...")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_PATHS = [
    str(MODEL_PATH),
    os.path.join(SCRIPT_DIR, 'engagement_cnn.h5'),
    os.path.join(SCRIPT_DIR, '..', 'models', 'engagement_cnn.h5'),
]

model_path = None
for path in POSSIBLE_PATHS:
    if os.path.exists(path):
        model_path = path
        print(f"✅ Found model at: {path}")
        break

if model_path is None:
    print(f"\n❌ ERROR: Model file 'engagement_cnn.h5' not found!")
    print(f"Searched in these locations:")
    for path in POSSIBLE_PATHS:
        print(f"  - {os.path.abspath(path)}")
    exit(1)

engagement_model = load_model(model_path)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
print("✅ Model loaded successfully")

# ========================================
# PROCESS IMAGE AND DETECT EMOTION
# ========================================
def detect_emotion(base64_string):
    """
    Takes base64 image, detects face, predicts emotion
    Returns: dict with emotion data
    """
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            return {
                "emotion": "N/A",
                "confidence": 0.0,
                "probabilities": {},
                "face_detected": False
            }
        
        (x, y, w, h) = max(faces, key=lambda face: face[2] * face[3])
        roi_gray = gray[y:y + h, x:x + w]
        
        roi_resized = cv2.resize(roi_gray, (48, 48))
        roi_normalized = roi_resized / 255.0
        roi_reshaped = np.reshape(roi_normalized, (1, 48, 48, 1))
        
        predictions = engagement_model.predict(roi_reshaped, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx] * 100)
        emotion = CLASS_LABELS[predicted_idx]
        
        probabilities = {
            label: round(float(prob * 100), 2) 
            for label, prob in zip(CLASS_LABELS, predictions[0])
        }
        
        return {
            "emotion": emotion,
            "confidence": confidence,
            "probabilities": probabilities,
            "face_detected": True
        }
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return {
            "emotion": "Error",
            "confidence": 0.0,
            "probabilities": {},
            "face_detected": False,
            "error": str(e)
        }

# ========================================
# SEND DATA TO NODE.JS API
# ========================================
def save_to_nodejs(user_id, email, emotion_data):
    """
    Sends emotion data to Node.js backend via HTTP POST
    Node.js will save it to MongoDB
    """
    try:
        payload = {
            "userId": user_id,
            "email": email,
            "emotion": emotion_data["emotion"],
            "confidence": emotion_data["confidence"],
            "probabilities": emotion_data["probabilities"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        response = requests.post(NODE_API, json=payload, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Saved to MongoDB: {emotion_data['emotion']} ({emotion_data['confidence']:.1f}%)")
            return response.json()
        else:
            print(f"❌ Node.js error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to Node.js: {e}")
        return None

# ========================================
# WEBSOCKET HANDLER
# ========================================
async def handle_client(websocket):
    """
    Receives video frames from React app
    Processes emotion detection
    Sends result back to React
    Saves to Node.js/MongoDB
    """
    print(f"✅ Client connected: {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                user_id = data.get("userId")
                email = data.get("email")
                image_data = data.get("image")
                
                if not (user_id or email):
                    await websocket.send(json.dumps({
                        "success": False,
                        "error": "Missing userId or email"
                    }))
                    continue
                
                if not image_data:
                    await websocket.send(json.dumps({
                        "success": False,
                        "error": "Missing image data"
                    }))
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
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await websocket.send(json.dumps(response))
                
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "success": False,
                    "error": "Invalid JSON"
                }))
            except Exception as e:
                print(f"❌ Error: {e}")
                await websocket.send(json.dumps({
                    "success": False,
                    "error": str(e)
                }))
    
    except websockets.exceptions.ConnectionClosed:
        print("⚠️ Client disconnected")
    finally:
        print(f"🔌 Connection closed: {websocket.remote_address}")

# ========================================
# START SERVER
# ========================================
async def main():
    print("="*60)
    print("  Engagement Detection WebSocket Server")
    print("="*60)
    print(f"📡 WebSocket listening on: ws://localhost:{WEBSOCKET_PORT}")
    print(f"🔗 Node.js API endpoint: {NODE_API}")
    print("⏳ Waiting for connections...\n")
    
    async with websockets.serve(handle_client, "localhost", WEBSOCKET_PORT, max_size=2_000_000):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⛔ Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")