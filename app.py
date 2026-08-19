import os
import base64
import io

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

app = Flask(__name__)

HF_API_KEY = os.getenv("HF_API_KEY")

if not HF_API_KEY:
    raise ValueError("HF_API_KEY .env file mein nahi mili.")

client = InferenceClient(
    api_key=HF_API_KEY,
    provider="auto"
)


@app.route("/")
def home():
    return render_template("index.html")


# ---------- MODULE 1: Text → Image ----------
@app.route("/api/generate-image", methods=["POST"])
def generate_image():

    data = request.get_json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({
            "error": "Prompt likhna zaroori hai"
        }), 400

    try:
        image = client.text_to_image(
            prompt=prompt,
            model="black-forest-labs/FLUX.1-schnell"
        )

        image_bytes = io.BytesIO()
        image.save(image_bytes, format="PNG")

        image_base64 = base64.b64encode(
            image_bytes.getvalue()
        ).decode("utf-8")

        return jsonify({
            "image": f"data:image/png;base64,{image_base64}"
        })

    except Exception as e:
        print("TEXT TO IMAGE ERROR:", repr(e))

        return jsonify({
            "error": "Image generate nahi ho saki",
            "details": str(e)
        }), 500


# ---------- MODULE 2: Image → Description ----------
@app.route("/api/describe-image", methods=["POST"])
def describe_image():

    if "image" not in request.files:
        return jsonify({
            "error": "Image file bhejna zaroori hai"
        }), 400

    image_file = request.files["image"]

    if image_file.filename == "":
        return jsonify({
            "error": "Image select karo"
        }), 400

    try:
        image_bytes = image_file.read()

        encoded_image = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        image_url = (
            f"data:{image_file.mimetype};base64,{encoded_image}"
        )

        result = client.chat.completions.create(
            model="google/gemma-3-4b-it",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this image clearly and give a detailed description that could be used as an image-generation prompt."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ]
        )

        description = result.choices[0].message.content

        return jsonify({
            "description": description
        })

    except Exception as e:
        print("IMAGE TO TEXT ERROR:", repr(e))

        return jsonify({
            "error": "Description generate nahi ho saki",
            "details": repr(e)
        }), 500