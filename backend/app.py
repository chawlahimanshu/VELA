from flask import Flask, request, jsonify
from dotenv import load_dotenv
import whisper
import os
import anthropic

load_dotenv()

ffmpeg_path = os.getenv("FFMPEG_PATH", "")
if ffmpeg_path:
    os.environ["PATH"] += os.pathsep + ffmpeg_path
app = Flask(__name__)
model = whisper.load_model("base")
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
system_prompt = """
    You are an expert life insurance agent assistant listening to a live client call.
    The agent will type what the client is saying during the call.
    Your job is to instantly give the agent the best possible response to say to the client.

    Rules:
    - Keep responses short and conversational — the agent needs to say this out loud
    - Sound human, not robotic
    - Focus on building trust and addressing concerns
    - Suggest relevant life insurance products when appropriate
    - Handle objections with empathy first, then logic
    - Never use bullet points — give one clear response the agent can say directly
    """

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    audio_file = request.files["audio"]
    audio_file.save("temp_audio.wav")
    result = model.transcribe("temp_audio.wav")
    return jsonify({"transcript": result["text"]})

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.json
    messages = data["messages"]

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=system_prompt,
        messages=messages
    )

    reply = response.content[0].text
    return jsonify({"reply": reply})


if __name__ == "__main__":
    app.run(debug=True)