from flask import Flask, request, jsonify, Response, redirect, session
from dotenv import load_dotenv
import whisper
import os
import anthropic
import json
from flask_cors import CORS
from flask_socketio import SocketIO
import requests


load_dotenv()

ffmpeg_path = os.getenv("FFMPEG_PATH", "")
if ffmpeg_path:
    os.environ["PATH"] += os.pathsep + ffmpeg_path

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "vela-secret-key")
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

model = whisper.load_model("base")
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

system_prompt = """
You are an expert life insurance agent assistant listening to a live client call.
Your job is to instantly give the agent the best possible response to say to the client.

Rules:
- Keep responses short and conversational — the agent needs to say this out loud
- Sound human, not robotic
- Focus on building trust and addressing concerns
- Suggest relevant life insurance products when appropriate
- Handle objections with empathy first, then logic
- Never use bullet points or markdown
- Give one clear response the agent can say directly
"""

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.json
    messages = data["messages"]

    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system_prompt,
            messages=messages
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"

    return Response(generate(), mimetype="text/event-stream")

@socketio.on("transcript")
def handle_transcript(data):
    speaker = data["speaker"]
    sentence = data["sentence"]

    print(f"Speaker {speaker}: {sentence}")

    socketio.emit("live_transcript", {"speaker": speaker, "sentence": sentence})

    if speaker == 1 and len(sentence) > 20:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            system=system_prompt,
            messages=[{"role": "user", "content": sentence}]
        )
        suggestion = response.content[0].text
        print(f"VELA suggests: {suggestion}")
        socketio.emit("suggestion", {"text": suggestion})

        
@app.route("/oauth/login")
def oauth_login():
    sf_auth_url = (
        f"https://orgfarm-850b7a33a2-dev-ed.develop.my.salesforce.com/services/oauth2/authorize?"
        f"client_id={os.getenv('SF_CLIENT_ID')}&"
        f"redirect_uri=http://localhost:5000/oauth/callback&"
        f"response_type=code"
    )
    return redirect(sf_auth_url)



@app.route("/oauth/callback")
def oauth_callback():
    code = request.args.get("code")

    response = requests.post(
    "https://orgfarm-850b7a33a2-dev-ed.develop.my.salesforce.com/services/oauth2/token",
    data={
        "grant_type": "authorization_code",
        "code": code,
        "client_id": os.getenv("SF_CLIENT_ID"),
        "client_secret": os.getenv("SF_CLIENT_SECRET"),
        "redirect_uri": "http://localhost:5000/oauth/callback"
        }
    )
    token_data = response.json()
    access_token = token_data["access_token"]

    session["sf_token"] = access_token
    return redirect("http://localhost:3000")



if __name__ == "__main__":
    socketio.run(app, debug=True, use_reloader=False)
    