import os
import pyaudio
from dotenv import load_dotenv
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
import socketio as sio

load_dotenv()

# Audio settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
DEVICE_INDEX = 1

# Connect to Flask
client_socket = sio.Client()
client_socket.connect("http://localhost:5000")

def main():
    deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))
    connection = deepgram.listen.websocket.v("1")

    def on_message(self, result, **kwargs):
        sentence = result.channel.alternatives[0].transcript
        words = result.channel.alternatives[0].words
        speaker = words[0].speaker if words else 0
        if len(sentence) == 0:
            return
        client_socket.emit("transcript", {"speaker": speaker, "sentence": sentence})

    connection.on(LiveTranscriptionEvents.Transcript, on_message)

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        smart_format=True,
        diarize=True,
        punctuate=True,
        interim_results=False,
        encoding="linear16",
        sample_rate=RATE,
        channels=CHANNELS,
    )

    connection.start(options)
    print("Connected to Deepgram")

    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        input_device_index=DEVICE_INDEX,
        frames_per_buffer=CHUNK
    )

    print("VELA is listening... press Ctrl+C to stop")
    try:
        while True:
            data = stream.read(CHUNK, exception_on_overflow=False)
            connection.send(data)
    except KeyboardInterrupt:
        pass

    stream.stop_stream()
    stream.close()
    p.terminate()
    connection.finish()
    print("Stopped.")

if __name__ == "__main__":
    main()