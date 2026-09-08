"""
live_camera.py

Final Integrated Live Camera Stream with Real-Time Risk Engine Assessment.
"""

import os
import sys
import json
import time
import cv2
import numpy as np
import tensorflow as tf
import requests

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

# Import directly from the services package
from services.location_service import LocationService, LocationPayload
from services.weather_service import WeatherService, WeatherPayload
from services.soil_service import SoilService, SoilPayload
from services.risk_engine import RiskEngine, VisionDetection

# Paths now point straight to the model directory from root
DISEASE_MODEL_PATH = os.path.join(PROJECT_ROOT, "model", "diseases_model.keras")
DISEASE_CLASS_PATH = os.path.join(PROJECT_ROOT, "model", "diseases_classes.json")
PEST_MODEL_PATH = os.path.join(PROJECT_ROOT, "model", "pests_model.keras")
PEST_CLASS_PATH = os.path.join(PROJECT_ROOT, "model", "pests_classes.json")

IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.40

print("[INFO] Initializing Vision Models...")
disease_model = tf.keras.models.load_model(DISEASE_MODEL_PATH)
pest_model = tf.keras.models.load_model(PEST_MODEL_PATH)

with open(DISEASE_CLASS_PATH, "r") as f:
    disease_class_names = json.load(f)
with open(PEST_CLASS_PATH, "r") as f:
    pest_class_names = json.load(f)

def get_location_name(lat: float, lon: float):
    """Fetches village/district name via OSM Nominatim."""
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

def live_camera(location_ctx: LocationPayload, weather_ctx: WeatherPayload, soil_ctx: SoilPayload):
    print("\nStarting camera feed...")
    print("Controls:")
    print("  'q' - Quit")
    print("  's' - Save snapshot (Image + Integrated Risk JSON)")
    print("  'w' - Refresh weather telemetry")
    print("  'r' - Refresh soil properties")
    print("  'l' - Override farm coordinates manually\n")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Camera unreachable.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    loc_name = get_location_name(location_ctx.latitude, location_ctx.longitude)

    while True:
        ret, frame = cap.read()
        if not ret: break

        input_img = prepare_cv2_frame(frame)
        d_class, d_conf = get_prediction(disease_model, disease_class_names, input_img)
        p_class, p_conf = get_prediction(pest_model, pest_class_names, input_img)

        d_detection = VisionDetection(class_name=d_class, confidence=d_conf, threshold_passed=d_conf >= CONFIDENCE_THRESHOLD)
        p_detection = VisionDetection(class_name=p_class, confidence=p_conf, threshold_passed=p_conf >= CONFIDENCE_THRESHOLD)

        risk_payload = RiskEngine.evaluate(
            location=location_ctx,
            weather=weather_ctx,
            soil=soil_ctx,
            disease_detection=d_detection,
            pest_detection=p_detection
        )
        assessment = risk_payload.assessment
        
        cv2.rectangle(frame, (10, 10), (960, 260), (0, 0, 0), -1)

        border_color = (0, 255, 0) if assessment.risk_level == "LOW" else \
                       (0, 255, 255) if assessment.risk_level == "MEDIUM" else \
                       (0, 165, 255) if assessment.risk_level == "HIGH" else (0, 0, 255)

        cv2.rectangle(frame, (10, 10), (960, 260), border_color, 2)

        d_str = f"Disease: {d_class} ({d_conf:.1%})" if d_detection.threshold_passed else f"Disease: Unknown ({d_conf:.1%})"
        p_str = f"Pest:    {p_class} ({p_conf:.1%})" if p_detection.threshold_passed else f"Pest:    Unknown ({p_conf:.1%})"
        cv2.putText(frame, d_str, (25, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(frame, p_str, (25, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)

        cv2.putText(frame, f"RISK SCORE: {assessment.overall_risk_score}/100 [{assessment.risk_level}]",
                    (480, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, border_color, 2, cv2.LINE_AA)

        indices_str = f"Indices -> Disease Risk: {assessment.disease_risk_index} | Pest Risk: {assessment.pest_risk_index} | Soil Stress: {assessment.soil_stress_index}"
        cv2.putText(frame, indices_str, (25, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        loc_str = f"GPS: {location_ctx.latitude:.4f}, {location_ctx.longitude:.4f} | Area: {loc_name}"
        cv2.putText(frame, loc_str, (25, 128), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1, cv2.LINE_AA)

        if weather_ctx and weather_ctx.success and weather_ctx.current:
            w = weather_ctx.current
            w_str = f"Weather: {w.temperature_c} C | RH: {w.relative_humidity_pct}% | Rain: {w.rain_mm}mm | Wind: {w.wind_speed_kmh}km/h"
            cv2.putText(frame, w_str, (25, 156), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)

        if soil_ctx and soil_ctx.success and soil_ctx.properties:
            s = soil_ctx.properties
            s_str = f"Soil: pH {s.ph_water} | Clay: {s.clay_pct}% | Carbon: {s.organic_carbon_g_kg} g/kg"
            cv2.putText(frame, s_str, (25, 184), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 180, 100), 1, cv2.LINE_AA)

        rec_preview = f"Action: {assessment.agronomic_recommendations[0]}" if assessment.agronomic_recommendations else "Action: Monitoring"
        cv2.putText(frame, rec_preview[:90], (25, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        cv2.putText(frame, "Q: Quit | S: Save Snapshot | W: Refresh Weather | R: Refresh Soil | L: Set GPS", 
                    (20, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.imshow("Agri-AI Live Decision Support System", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("w"):
            print("[INFO] Fetching Live Weather...")
            weather_ctx = WeatherService.get_weather_for_location(location_ctx)
        elif key == ord("r"):
            print("[INFO] Fetching Live Soil Data...")
            soil_ctx = SoilService.get_soil_for_location(location_ctx)
        elif key == ord("s"):
            ts = int(time.time())
            img_fn = f"snapshot_{ts}.jpg"
            json_fn = f"snapshot_{ts}.json"
            cv2.imwrite(img_fn, frame)
            
            payload_dict = risk_payload.model_dump()
            payload_dict['live_telemetry'] = {
                'weather': weather_ctx.model_dump() if weather_ctx.success else None,
                'soil': soil_ctx.model_dump() if soil_ctx.success else None,
                'location_name': loc_name
            }
            
            with open(json_fn, "w") as f:
                json.dump(payload_dict, f, indent=2)
            print(f"\n[SAVED] Image: {img_fn} | Risk JSON Payload: {json_fn}\n")
        elif key == ord("l"):
            try:
                lat = float(input("Enter Latitude: "))
                lon = float(input("Enter Longitude: "))
                location_ctx = LocationService.create_location(latitude=lat, longitude=lon, source="manual")
                loc_name = get_location_name(lat, lon)
                
                print("[INFO] Updating Weather & Soil for new coordinates...")
                weather_ctx = WeatherService.get_weather_for_location(location_ctx)
                soil_ctx = SoilService.get_soil_for_location(location_ctx)
                print("[SUCCESS] Context re-initialized.\n")
            except Exception as e:
                print(f"[ERROR] Coordinate update failed: {e}\n")

    cap.release()
    cv2.destroyAllWindows()

def main():
    print("\n[INFO] Initializing Location Context (Defaulting to Nagpur, India for demo)...")
    loc_ctx = LocationService.create_location(latitude=21.1458, longitude=79.0882, source="gps")
    
    print("[INFO] Querying Open-Meteo Weather Service...")
    weather_ctx = WeatherService.get_weather_for_location(loc_ctx)

    print("[INFO] Querying ISRIC SoilGrids Service...")
    soil_ctx = SoilService.get_soil_for_location(loc_ctx)

    live_camera(loc_ctx, weather_ctx, soil_ctx)

if __name__ == "__main__":
    main()
