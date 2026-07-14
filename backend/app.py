from flask import Flask, request, jsonify, Response, redirect, session
from dotenv import load_dotenv
import os
import anthropic
import json
import json as json_module
from flask_cors import CORS
from flask_socketio import SocketIO
import requests
import firebase_admin
from firebase_admin import credentials, auth
from google.cloud import secretmanager
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "vela-secret-key")
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Authorization", "Content-Type"])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── setup clients ─────────────────────────────────────────────────────────────


secret_client = secretmanager.SecretManagerServiceClient()
PROJECT_ID = "vela-46027"
deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

# ── firebase admin ────────────────────────────────────────────────────────────

def load_firebase_cred():
    if os.path.exists("firebase-admin.json"):
        # local dev — use the file
        return credentials.Certificate("firebase-admin.json")
    else:
        # cloud run — fetch from secret manager
        name = f"projects/{PROJECT_ID}/secrets/firebase-admin-json/versions/latest"
        resp = secret_client.access_secret_version(request={"name": name})
        info = json_module.loads(resp.payload.data.decode("utf-8"))
        return credentials.Certificate(info)

firebase_admin.initialize_app(load_firebase_cred())

# ── session state ─────────────────────────────────────────────────────────────

user_sessions = {}   # socket sid -> uid
dg_connections = {}  # socket sid -> deepgram connection

# ── system prompt ─────────────────────────────────────────────────────────────

system_prompt = """
You are VELA, a real-time whisper assistant for a MetLife benefits agent who is on a live
sales call right now. You hear what the CLIENT just said, and you feed the AGENT the single
best thing to say back — as if you're quietly in their ear.

THE SCENARIO
The agent sells GROUP employee benefits to a business owner, HR manager, or benefits
administrator who is deciding what to offer their staff. This is not individual life insurance
for one consumer. The products in play are:
- Group Basic Term Life (often employer-paid, guaranteed issue up to a limit)
- Voluntary / Supplemental Term Life (employee-paid, added on top)
- Dependent Term Life (spouse and child coverage)
- AD&D and Family AD&D (accident coverage)
- Group Universal Life (GUL) and Group Variable Universal Life (GVUL) — permanent, portable,
  build cash value
Key selling points you may reference when relevant: guaranteed issue with little or no medical
exam on basic tiers, payroll deduction, portability when an employee leaves, and easy enrollment.

YOUR JOB
Read the client's last line, judge what kind of moment it is, and output ONE line the agent can
say out loud, word for word. Nothing else.

READ THE MOMENT, THEN RESPOND
- Question ("How much is it?", "Is there an exam?") -> answer plainly if it's a known product
  fact; if it depends on their specifics or a price, don't guess — have the agent get the detail
  or promise an exact figure in the proposal.
- Objection ("Too expensive", "My team won't use it", "We already have benefits") -> acknowledge
  the concern in their own words first, then reframe with one concrete point. Never argue.
- Buying signal ("That sounds good", "How do we start?") -> move it forward. Confirm and steer to
  the next step (a proposal, a follow-up, enrollment).
- Stall ("Let me think about it", "Send me some info") -> accept it, then ask one light question
  to keep it alive or pin a next step.
- Discovery gap (you don't yet know team size, budget, or current coverage) -> ask ONE sharp
  question instead of pitching. Good agents qualify before they present.
- Small talk / rapport -> match it briefly and warmly, then gently guide back.

HOW IT SHOULD SOUND
- One to three sentences. This is spoken on a live call, not written.
- Natural and human — warm, confident, a little conversational. Never scripted or robotic.
- Mirror the client's own words and tone.
- Commit to the single strongest response. Do not offer the agent a menu of options.

HARD RULES
- Never invent prices, coverage amounts, percentages, or facts you weren't given. If a number is
  needed, have the agent say they'll get the exact figure rather than making one up.
- Don't make guarantees or promises about approval, payouts, or taxes, and don't give tax or
  legal advice. Keep claims accurate and modest.
- Output ONLY the words the agent should say. No preamble, no "You could say:", no labels, no
  explanation of your reasoning.
- No markdown, no bullet points, no lists, no quotation marks around the line.
"""

# ── helpers ───────────────────────────────────────────────────────────────────

def get_user_id():
    try:
        header = request.headers.get("Authorization")
        token = header.split("Bearer ")[1]
        decoded = auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        return None


def get_key(uid, provider):
    try:
        name = f"projects/{PROJECT_ID}/secrets/{provider}-key-{uid}/versions/latest"
        resp = secret_client.access_secret_version(request={"name": name})
        return resp.payload.data.decode("utf-8")
    except Exception:
        return None


# ── http routes ───────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})


@app.route("/whoami")
def whoami():
    uid = get_user_id()
    return jsonify({"uid": uid})


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.json
    messages = data["messages"]

    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system_prompt,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"

    return Response(generate(), mimetype="text/event-stream")


@app.route("/save-key", methods=["POST"])
def save_key():
    uid = get_user_id()
    if not uid:
        return jsonify({"ok": False, "error": "Not authenticated"}), 401

    data = request.json
    provider = data.get("provider")
    key = data.get("key")
    secret_name = f"{provider}-key-{uid}"
    parent = f"projects/{PROJECT_ID}"

    try:
        secret_client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_name,
                "secret": {"replication": {"automatic": {}}},
            }
        )
    except Exception:
        pass  # already exists

    secret_client.add_secret_version(
        request={
            "parent": f"{parent}/secrets/{secret_name}",
            "payload": {"data": key.encode("utf-8")},
        }
    )
    return jsonify({"ok": True})


@app.route("/oauth/login")
def oauth_login():
    sf_auth_url = (
        f"https://orgfarm-850b7a33a2-dev-ed.develop.my.salesforce.com/services/oauth2/authorize?"
        f"client_id={os.getenv('SF_CLIENT_ID')}&"
        f"redirect_uri={os.getenv('SF_REDIRECT_URI', 'http://localhost:5000/oauth/callback')}&"
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
            "redirect_uri": os.getenv("SF_REDIRECT_URI", "http://localhost:5000/oauth/callback"),
        },
    )
    token_data = response.json()
    session["sf_token"] = token_data["access_token"]
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return redirect(frontend_url)


# ── socket handlers ───────────────────────────────────────────────────────────

@socketio.on("authenticate")
def handle_auth(data):
    try:
        token = data.get("token")
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]
        user_sessions[request.sid] = uid
        print(f"[auth] socket {request.sid} → uid {uid}")
    except Exception:
        pass


@socketio.on("start_stream")
def start_stream(data):
    sid = request.sid
    language = (data or {}).get("language", "en-US")
    
    uid = user_sessions.get(sid)
    dg_key = get_key(uid, "deepgram") if uid else None
    if not dg_key:
        socketio.emit("suggestion", {"text": "Please add your Deepgram API key in Settings."}, to=sid)
        return
    
    connection = DeepgramClient(dg_key).listen.websocket.v("1")
    

    def on_message(self, result, **kwargs):
        sentence = result.channel.alternatives[0].transcript
        if not sentence:
            return
        words = result.channel.alternatives[0].words
        speaker = words[0].speaker if words else 0

        socketio.emit("live_transcript", {"speaker": speaker, "sentence": sentence}, to=sid)

        if speaker == 1:
            uid = user_sessions.get(sid)
            api_key = get_key(uid, "anthropic") if uid else None
            if not api_key:
                socketio.emit("suggestion", {"text": "Please add your Claude API key in Settings."}, to=sid)
                return
            claude = anthropic.Anthropic(api_key=api_key)
            resp = claude.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=200,
                system=system_prompt,
                messages=[{"role": "user", "content": sentence}],
            )
            socketio.emit("suggestion", {"text": resp.content[0].text}, to=sid)

    connection.on(LiveTranscriptionEvents.Transcript, on_message)
    options = LiveOptions(
        model="nova-2",
        language=language,
        smart_format=True,
        diarize=True,
        punctuate=True,
        interim_results=False,
        encoding="linear16",
        sample_rate=16000,
        channels=1,
    )
    connection.start(options)
    dg_connections[sid] = connection
    print(f"[deepgram] stream started for {sid} ({language})")


@socketio.on("audio")
def on_audio(data):
    conn = dg_connections.get(request.sid)
    if conn:
        try:
            conn.send(bytes(data))
        except Exception:
            pass


@socketio.on("stop_stream")
def stop_stream():
    conn = dg_connections.pop(request.sid, None)
    if conn:
        try:
            conn.finish()
        except Exception:
            pass


@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    user_sessions.pop(sid, None)
    conn = dg_connections.pop(sid, None)
    if conn:
        try:
            conn.finish()
        except Exception:
            pass


# ── run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=False,
        use_reloader=False,
        allow_unsafe_werkzeug=True,
    )