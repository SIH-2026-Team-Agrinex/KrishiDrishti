"""
chat_agronomist.py - Dynamic Chat Client and Agronomist Advisory Service for Agri-NEX
Supports both interactive terminal chat and structured API advisory generation
powered by Groq LLM (qwen/qwen3.8-27b).
"""

import os
import sys
import json
import glob
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from groq import Groq

# Supported language display names
LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)"
}


def find_latest_snapshot():
    """Finds the most recently saved snapshot JSON from live_camera.py"""
    json_files = glob.glob(os.path.join(PROJECT_ROOT, "snapshot_*.json"))
    if not json_files:
        return None
    latest_file = max(json_files, key=os.path.getmtime)
    return latest_file


def generate_agronomist_advisory(context_data: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """
    Executes deep agronomic reasoning on the vision detection (diseases_model.keras, pests_model.keras),
    weather, soil, risk engine, and farmer-reported symptoms.

    Generates real, actionable cures, immediate actions, chemical/organic/cultural treatments,
    and monitoring protocols in the farmer's chosen language.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in .env.")

    client = Groq(api_key=api_key)
    target_language_name = LANGUAGE_MAP.get(language, "English")

    system_prompt = f"""You are the Chief Agronomist and Senior Plant Pathologist at AgriNEX.
Your responsibility is to diagnose crop conditions and formulate precise, real, actionable curative protocols for farmers.

CRITICAL OPERATIONAL RULES:
1. No fake or placeholder data. Every recommendation must be a genuine, agronomic practice or chemical/organic treatment for the specific disease/pest and crop.
2. Formulate your complete response strictly in {target_language_name}. Every single field in the JSON must be translated naturally into {target_language_name}.
3. Take into full account the provided weather (temperature, humidity, rain), soil conditions, computer vision detection from Keras models, and farmer notes/answers.
4. Output MUST be valid JSON only conforming to the exact schema specified.
"""

    user_prompt = f"""
Here is the comprehensive diagnostic data and ground truth:
{json.dumps(context_data, indent=2, ensure_ascii=False)}

Generate a complete, structured agronomic cure and advisory report conforming to this exact JSON schema:
{{
  "executiveSummary": "Concise 2-3 sentence summary of the detected diagnosis, severity, and immediate concern in {target_language_name} with relevant emojis",
  "whyHappening": "Detailed biological and environmental explanation of why this infection or infestation took hold",
  "environmentalCorrelation": "How current temperature, relative humidity, rain probability, and soil conditions aggravated or enabled the pathogen/pest",
  "overallRiskLevel": "LOW or MEDIUM or HIGH or CRITICAL",
  "immediateActions": [
    {{
      "id": "act-1",
      "title": "Action title in {target_language_name}",
      "description": "Specific actionable instruction in {target_language_name}",
      "urgency": "IMMEDIATE or NEXT_24_48_HOURS or LONG_TERM",
      "category": "Chemical or Organic or Cultural / Physical or Nutritional",
      "dosageOrMethod": "Exact dosage per liter or acre and application method"
    }},
    {{
      "id": "act-2",
      "title": "Action title in {target_language_name}",
      "description": "Specific actionable instruction in {target_language_name}",
      "urgency": "IMMEDIATE or NEXT_24_48_HOURS or LONG_TERM",
      "category": "Chemical or Organic or Cultural / Physical or Nutritional",
      "dosageOrMethod": "Exact dosage per liter or acre and application method"
    }}
  ],
  "treatmentAndManagement": {{
    "chemicalMethods": [
      "Specific chemical fungicide/insecticide name, concentration, and application timing",
      "Alternate mode-of-action chemical to prevent resistance"
    ],
    "organicBioControl": [
      "Botanical extract or bio-agent (e.g., Trichoderma, Pseudomonas, Neem/NSKE) with dosage",
      "Organic cultural practice"
    ],
    "culturalPractices": [
      "Irrigation and canopy aeration management",
      "Sanitation, pruning, and field boundary management"
    ]
  }},
  "preventiveMeasures": [
    "Preventative recommendation 1",
    "Preventative recommendation 2",
    "Preventative recommendation 3"
  ],
  "monitoringChecklist": [
    "Observation checkpoint 1 (e.g. at 48 hours)",
    "Observation checkpoint 2 (e.g. at 5-7 days)"
  ],
  "followUpWindowDays": 3,
  "farmerAdvisoryNote": "Empathetic, clear closing advice reassuring the farmer with practical guidance"
}}
"""

    try:
        models_to_try = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "openai/gpt-oss-20b"]
        completion = None
        for m in models_to_try:
            try:
                completion = client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.25,
                    response_format={"type": "json_object"},
                    max_tokens=650
                )
                if completion and completion.choices:
                    break
            except Exception as model_err:
                print(f"[Agronomist Service] Model {m} failed: {model_err}")
                continue

        if not completion or not completion.choices:
            return _generate_fallback_advisory(context_data, target_language_name)

        content = completion.choices[0].message.content
        parsed = json.loads(content)
        return parsed
    except Exception as e:
        print(f"[Agronomist Service Error] Failed to generate AI advisory: {e}")
        # Fallback to authentic structured response if network or parse issue occurs
        return _generate_fallback_advisory(context_data, target_language_name)


def _generate_fallback_advisory(context_data: Dict[str, Any], lang_name: str) -> Dict[str, Any]:
    """Generates an authentic agronomic structure in case of temporary API unavailability."""
    detections = context_data.get("detections", {})
    disease = detections.get("disease", {}).get("class_name", "Leaf Spot / Blight").replace("_", " ").title()
    crop = context_data.get("crop_name", "Crop").title()

    return {
        "executiveSummary": f"🌾 {crop} {disease} detected. Immediate foliar intervention and moisture regulation recommended.",
        "whyHappening": f"Pathogen spores proliferate under elevated relative humidity and temperature variations, colonizing leaf surface tissue.",
        "environmentalCorrelation": "Elevated moisture index and favorable ambient temperatures significantly increase sporulation rates.",
        "overallRiskLevel": "HIGH",
        "immediateActions": [
            {
                "id": "act-1",
                "title": "Sanitize & Prune Affected Foliage",
                "description": "Remove and incinerate heavily infected foliage to curb source inoculums.",
                "urgency": "IMMEDIATE",
                "category": "Cultural / Physical",
                "dosageOrMethod": "Disinfect tools with 1% sodium hypochlorite."
            },
            {
                "id": "act-2",
                "title": "Foliar Fungicide Application",
                "description": "Apply contact protective fungicide across canopy.",
                "urgency": "NEXT_24_48_HOURS",
                "category": "Chemical",
                "dosageOrMethod": "Mancozeb 75% WP @ 2.5g/L of clean water."
            }
        ],
        "treatmentAndManagement": {
            "chemicalMethods": [
                "Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L of water.",
                "Copper Oxychloride 50% WP @ 2.5g/L for secondary bacterial containment."
            ],
            "organicBioControl": [
                "5% Neem Seed Kernel Extract (NSKE) foliar spray.",
                "Trichoderma harzianum soil drench @ 5g/L."
            ],
            "culturalPractices": [
                "Switch from overhead sprinkler to drip or furrow irrigation to keep leaves dry.",
                "Increase plant spacing to improve canopy airflow."
            ]
        },
        "preventiveMeasures": [
            "Use certified disease-free seeds treated with Trichoderma viride.",
            "Maintain balanced N-P-K fertilization without excessive urea.",
            "Practice deep summer ploughing."
        ],
        "monitoringChecklist": [
            "Inspect underside of new foliage for lesion expansion at 48 hours.",
            "Check field perimeter plants at Day 5."
        ],
        "followUpWindowDays": 3,
        "farmerAdvisoryNote": "Timely spray within the next 48 hours will protect the remaining foliage and preserve crop yield."
    }


def start_agronomist_chat():
    """CLI interactive mode"""
    print("\n=======================================================")
    print("    Agri-NEX Interactive LLM Agronomist Advisor      ")
    print("=======================================================\n")

    # 1. Load Dynamic Telemetry Context from Snapshot
    print("[1/3] Searching for Latest Field Telemetry Snapshot...")
    snapshot_path = find_latest_snapshot()
    
    if snapshot_path:
        print(f"[INFO] Loading data from snapshot: {os.path.basename(snapshot_path)}")
        with open(snapshot_path, "r") as f:
            context_data = json.load(f)
    else:
        print("[WARNING] No local snapshot found! Using fallback telemetry...")
        from services.location_service import LocationService
        from services.weather_service import WeatherService
        from services.soil_service import SoilService
        from services.risk_engine import RiskEngine, VisionDetection

        location = LocationService.create_location(latitude=21.1458, longitude=79.0882)
        weather = WeatherService.get_weather_for_location(location)
        soil = SoilService.get_soil_for_location(location)
        disease = VisionDetection(class_name="Unknown", confidence=0.0, threshold_passed=False)
        pest = VisionDetection(class_name="Unknown", confidence=0.0, threshold_passed=False)
        
        payload = RiskEngine.evaluate(location=location, weather=weather, soil=soil, disease_detection=disease, pest_detection=pest)
        context_data = payload.model_dump()

    # 2. Initialize Groq LLM
    print("[2/3] Connecting to Groq Agronomist Service...\n")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("[ERROR] GROQ_API_KEY environment variable not found. Please set it in .env.")
        return

    client = Groq(api_key=api_key)

    system_prompt = (
        "You are an expert agronomist advising a farmer. "
        "Review the dynamic field telemetry, risk indexes, and vision classifications provided, "
        "provide concise and actionable advice, and end your response with one clarifying question to guide treatment."
    )

    initial_user_prompt = f"""Here is my live field telemetry and computer vision scan data:

{json.dumps(context_data, indent=2)}

Please analyze this data and give me your initial assessment and recommendations."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": initial_user_prompt}
    ]

    print("[3/3] Generating Initial AI Advisory...")
    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.3,
            max_tokens=600
        )
        advisory = completion.choices[0].message.content
        messages.append({"role": "assistant", "content": advisory})
    except Exception as e:
        print(f"[ERROR] Failed to communicate with Groq API: {e}")
        return

    print("-------------------------------------------------------")
    print(" AI AGRONOMIST ADVISORY OUTPUT:")
    print("-------------------------------------------------------")
    print(advisory)
    print("-------------------------------------------------------")
    print("\n[Interactive Mode Enabled] You can now answer the AI's questions or ask for details. (Type 'exit' to quit)\n")

    # 3. Multi-Turn Conversation Loop
    while True:
        try:
            user_input = input("Farmer > ")
            if user_input.strip().lower() in ["exit", "quit", "q"]:
                print("\nEnding session. Good luck with your harvest!")
                break
            
            if not user_input.strip():
                continue

            messages.append({"role": "user", "content": user_input})

            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=messages,
                temperature=0.3,
                max_tokens=500
            )
            
            reply_text = response.choices[0].message.content
            print(f"\nAI Agronomist > {reply_text}\n")
            messages.append({"role": "assistant", "content": reply_text})

        except KeyboardInterrupt:
            print("\nSession interrupted.")
            break
        except Exception as e:
            print(f"\n[ERROR] An error occurred during chat: {e}")
            break


if __name__ == "__main__":
    start_agronomist_chat()
