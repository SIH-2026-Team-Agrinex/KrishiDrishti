"""
camera_agronomist.py

Unified workflow: Streams live camera with real-time risk telemetry.
Pressing 's' saves the diagnostic snapshot JSON and instantly launches 
the Groq Qwen agronomist chat session in the terminal.
"""

import os
import sys
import json
import time
import cv2
import numpy as np
import tensorflow as tf
import requests
from groq import Groq

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from services.location_service import LocationService, LocationPayload
from services.weather_service import WeatherService, WeatherPayload
from services.soil_service import SoilService, SoilPayload
from services.risk_engine import RiskEngine, VisionDetection

# 1. Model & Label Paths
DISEASE_MODEL_PATH = os.path.join(PROJECT_ROOT, "model", "diseases_model.keras")
DISEASE_CLASS_PATH = os.path.join(PROJECT_ROOT, "model", "diseases_classes.json")
PEST_MODEL_PATH = os.path.join(PROJECT_ROOT, "model", "pests_model.keras")
PEST_CLASS_PATH = os.path.join(PROJECT_ROOT, "model", "pests_classes.json")

IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.40

print("[INFO] Loading Vision Models into Memory...")
disease_model = tf.keras.models.load_model(DISEASE_MODEL_PATH)
pest_model = tf.keras.models.load_model(PEST_MODEL_PATH)

with open(DISEASE_CLASS_PATH, "r") as f:
    disease_class_names = json.load(f)
with open(PEST_CLASS_PATH, "r") as f:
    pest_class_names = json.load(f)

def get_location_name(lat: float, lon: float) -> str:
    headers = {"User-Agent": "AgriDiseaseApp/1.0"}
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    try:
        res = requests.get(url, headers=headers, timeout=5).json()
        return res.get("address", {}).get("county", res.get("name", "Unknown Area"))
    except Exception:
        return "Unknown Area"

def prepare_cv2_frame(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, IMG_SIZE)
    input_arr = resized.astype(np.float32)
    return np.expand_dims(input_arr, axis=0)

def get_prediction(model, class_names, image_array):
    preds = model.predict(image_array, verbose=0)
    idx = int(np.argmax(preds[0]))
    return class_names[idx], float(preds[0][idx])

def launch_agronomist_chat(context_data: dict):
    """Launches the interactive Groq Qwen chat seeded with the snapshot data."""
    print("\n=======================================================")
    print("    Agri-NEX Interactive AI Agronomist Session         ")
    print("=======================================================\n")

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("[ERROR] GROQ_API_KEY environment variable not set.")
        return

    client = Groq(api_key=api_key)

    system_prompt = (
        "You are an expert agronomist advising a farmer. "
        "Analyze the provided field telemetry, soil data, and vision diagnostic results. "
        "Give actionable, concise treatment advice and conclude with one clarifying question."
    )

    initial_prompt = f"""Here is my current live field snapshot and telemetry data:

{json.dumps(context_data, indent=2)}

Please review this assessment and provide your recommendations."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": initial_prompt}
    ]

    print("[INFO] Contacting Groq Agronomist Service...")
    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )
        advisory = completion.choices[0].message.content
        messages.append({"role": "assistant", "content": advisory})
    except Exception as e:
        print(f"[ERROR] Communication with Groq failed: {e}")
        return

    print("\n-------------------------------------------------------")
    print(" AI ADVISORY OUTPUT:")
    print("-------------------------------------------------------")
    print(advisory)
    print("-------------------------------------------------------")
    print("\n[Chat Active] Ask follow-up questions or describe symptoms. (Type 'exit' to quit)\n")

    while True:
        try:
            user_input = input("Farmer > ")
            if user_input.strip().lower() in ["exit", "quit", "q"]:
                print("\nExiting chat session. Good luck with your harvest!")
                break
            if not user_input.strip():
                continue

            messages.append({"role": "user", "content": user_input})
            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=messages,
                temperature=0.3,
                max_tokens=400
            )
            reply = response.choices[0].message.content
            print(f"\nAI Agronomist > {reply}\n")
            messages.append({"role": "assistant", "content": reply})

        except KeyboardInterrupt:
            print("\nSession paused.")
            break
        except Exception as e:
            print(f"\n[ERROR] An error occurred: {e}")
            break

def run_camera_stream():
    print("\n[INFO] Initializing Field Context...")
    location_ctx = LocationService.create_location(latitude=21.1458, longitude=79.0882, source="gps")
    weather_ctx = WeatherService.get_weather_for_location(location_ctx)
    soil_ctx = SoilService.get_soil_for_location(location_ctx)
    loc_name = get_location_name(location_ctx.latitude, location_ctx.longitude)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Camera unreachable.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("\nLive Stream Ready. Controls:")
    print("  's' - Save snapshot & launch AI Chatbot automatically")
    print("  'w' - Refresh weather data")
    print("  'r' - Refresh soil data")
    print("  'q' - Quit stream\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        input_img = prepare_cv2_frame(frame)
        d_class, d_conf = get_prediction(disease_model, disease_class_names, input_img)
        p_class, p_conf = get_prediction(pest_model, pest_class_names, input_img)

        d_detection = VisionDetection(
            class_name=d_class,
            confidence=d_conf,
            threshold_passed=d_conf >= CONFIDENCE_THRESHOLD
        )
        p_detection = VisionDetection(
            class_name=p_class,
            confidence=p_conf,
            threshold_passed=p_conf >= CONFIDENCE_THRESHOLD
        )

        risk_payload = RiskEngine.evaluate(
            location=location_ctx,
            weather=weather_ctx,
            soil=soil_ctx,
            disease_detection=d_detection,
            pest_detection=p_detection
        )
        assessment = risk_payload.assessment

        # Draw HUD Box
        cv2.rectangle(frame, (10, 10), (960, 240), (0, 0, 0), -1)
        border_color = (0, 255, 0) if assessment.risk_level == "LOW" else \
                       (0, 255, 255) if assessment.risk_level == "MEDIUM" else (0, 0, 255)
        cv2.rectangle(frame, (10, 10), (960, 240), border_color, 2)

        cv2.putText(frame, f"Disease: {d_class} ({d_conf:.1%})", (25, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Pest:    {p_class} ({p_conf:.1%})", (25, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Risk Score: {assessment.overall_risk_score}/100 [{assessment.risk_level}]", (480, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, border_color, 2)
        cv2.putText(frame, f"Location: {loc_name} ({location_ctx.latitude:.2f}, {location_ctx.longitude:.2f})", (25, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        cv2.putText(frame, "Press 'S' to Save Snapshot & Start AI Chatbot | 'Q' to Quit", (25, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        cv2.imshow("Agri-NEX Live Decision Support", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            cap.release()
            cv2.destroyAllWindows()
            break

        elif key == ord("w"):
            print("[INFO] Refreshing weather...")
            weather_ctx = WeatherService.get_weather_for_location(location_ctx)

        elif key == ord("r"):
            print("[INFO] Refreshing soil metrics...")
            soil_ctx = SoilService.get_soil_for_location(location_ctx)

        elif key == ord("s"):
            ts = int(time.time())
            img_fn = f"snapshot_{ts}.jpg"
            json_fn = f"snapshot_{ts}.json"
            cv2.imwrite(img_fn, frame)

            payload_dict = risk_payload.model_dump()
            payload_dict["live_telemetry"] = {
                "weather": weather_ctx.model_dump() if weather_ctx and weather_ctx.success else None,
                "soil": soil_ctx.model_dump() if soil_ctx and soil_ctx.success else None,
                "location_name": loc_name
            }

            with open(json_fn, "w") as f:
                json.dump(payload_dict, f, indent=2)
            print(f"\n[SAVED] {img_fn} and {json_fn}")

            # Close the camera feed before switching to terminal chat
            cap.release()
            cv2.destroyAllWindows()

            # Launch terminal chatbot
            launch_agronomist_chat(payload_dict)
            break

if __name__ == "__main__":
    run_camera_stream()
