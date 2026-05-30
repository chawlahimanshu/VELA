import requests

# Step 1 - transcribe
with open("test_audio1.mp3", "rb") as f:
    response = requests.post("http://localhost:5000/transcribe", files={"audio": f})
    transcript = response.json()["transcript"]
    print("Transcript:", transcript)

# Step 2 - chat
messages = [{"role": "user", "content": transcript}]
response2 = requests.post("http://localhost:5000/chat", json={"messages": messages})
print("Claude:", response2.json()["reply"])