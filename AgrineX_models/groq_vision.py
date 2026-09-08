import os
import base64
from groq import Groq

# Initialize the Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Function to convert local image to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

image_path = "sample_leaf.jpg"
base64_image = encode_image(image_path)

# Query the vision model
chat_completion = client.chat.completions.create(
    model="qwen/qwen3.8-27b",  # Multimodal vision model ID on Groq
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": "Analyze this crop image. Is this a plant disease or an insect pest?"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }
    ],
    temperature=0.3,
    max_tokens=300
)

print(chat_completion.choices[0].message.content)
