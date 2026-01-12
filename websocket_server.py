"""
WebSocket proxy server for AssemblyAI Real-Time Streaming v3
This runs alongside the Flask app and handles real-time audio streaming
with speaker diarization support.

Architecture:
  Frontend (React) <--Socket.IO--> This Server <--WebSocket--> AssemblyAI v3
"""

import os
import json
import threading
import base64
import ssl
import certifi
import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import websocket

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store active AssemblyAI connections per client
assemblyai_connections = {}
connection_ready = {}  # Track if connection is ready for audio


def create_assemblyai_connection(client_sid, sample_rate=16000):
    """Create a connection to AssemblyAI Real-Time Streaming v3 with speaker labels"""
    
    connection_ready[client_sid] = False
    
    def on_message(ws, message):
        """Handle messages from AssemblyAI v3"""
        try:
            data = json.loads(message)
            msg_type = data.get('type', data.get('message_type', 'unknown'))
            
            print(f"[AssemblyAI → {client_sid}] {msg_type}: {data.get('text', '')[:50] if data.get('text') else ''}")
            
            # Map v3 response types to consistent format for frontend
            if msg_type == 'session_begins' or msg_type == 'SessionBegins':
                connection_ready[client_sid] = True
                socketio.emit('transcription', {
                    'type': 'session_begins',
                    'session_id': data.get('session_id'),
                    'message': 'AssemblyAI session started'
                }, to=client_sid)
                
            elif msg_type == 'partial_transcript' or msg_type == 'PartialTranscript':
                socketio.emit('transcription', {
                    'type': 'partial',
                    'text': data.get('text', ''),
                    'speaker': data.get('speaker', None),
                    'confidence': data.get('confidence', 1.0)
                }, to=client_sid)
                
            elif msg_type == 'final_transcript' or msg_type == 'FinalTranscript':
                # v3 API provides speaker labels when enabled
                speaker = data.get('speaker', 'A')
                # Map speaker A/B to Seller/Buyer
                speaker_role = 'Seller' if speaker in ['A', 0, '0'] else 'Buyer'
                
                socketio.emit('transcription', {
                    'type': 'final',
                    'text': data.get('text', ''),
                    'speaker': speaker,
                    'speaker_role': speaker_role,
                    'confidence': data.get('confidence', 1.0),
                    'words': data.get('words', [])
                }, to=client_sid)
                
            elif msg_type == 'session_terminated' or msg_type == 'SessionTerminated':
                socketio.emit('transcription', {
                    'type': 'session_terminated',
                    'message': 'Session ended'
                }, to=client_sid)
                
            elif msg_type == 'error':
                socketio.emit('error', {
                    'message': data.get('error', 'Unknown error'),
                    'code': data.get('code')
                }, to=client_sid)
            else:
                # Forward any other message types
                socketio.emit('transcription', data, to=client_sid)
            
        except Exception as e:
            print(f"[AssemblyAI] Parse error: {e}")
            socketio.emit('error', {'message': f'Parse error: {str(e)}'}, to=client_sid)
    
    def on_error(ws, error):
        print(f"[AssemblyAI] WebSocket Error: {error}")
        socketio.emit('error', {'message': str(error)}, to=client_sid)
    
    def on_close(ws, close_status_code, close_msg):
        print(f"[AssemblyAI] Connection closed: {close_status_code} - {close_msg}")
        connection_ready[client_sid] = False
        socketio.emit('assemblyai_closed', {
            'code': close_status_code,
            'reason': close_msg
        }, to=client_sid)
    
    def on_open(ws):
        print(f"[AssemblyAI] WebSocket connected for client {client_sid}")
        
        # Send configuration message with speaker_labels enabled
        # AssemblyAI v3 requires a config message after connection
        config_message = {
            "type": "configure",
            "config": {
                "sample_rate": sample_rate,
                "speaker_labels": True,
                "encoding": "pcm_s16le"
            }
        }
        
        try:
            ws.send(json.dumps(config_message))
            print(f"[AssemblyAI] Sent config: speaker_labels=True, sample_rate={sample_rate}")
        except Exception as e:
            print(f"[AssemblyAI] Failed to send config: {e}")
        
        socketio.emit('assemblyai_connected', {
            'message': 'Connected to AssemblyAI',
            'speaker_labels': True
        }, to=client_sid)
    
    # AssemblyAI Real-Time Streaming v3 WebSocket URL
    ws_url = "wss://streaming.assemblyai.com/v3/ws"
    
    print(f"[AssemblyAI] Connecting to {ws_url}")
    print(f"[AssemblyAI] API Key configured: {bool(ASSEMBLYAI_API_KEY)}")
    
    ws = websocket.WebSocketApp(
        ws_url,
        header={
            "Authorization": f"Bearer {ASSEMBLYAI_API_KEY}",
            "Content-Type": "application/json"
        },
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    
    # Run in background thread with SSL context
    def run_ws():
        try:
            ws.run_forever(
                sslopt={
                    "cert_reqs": ssl.CERT_REQUIRED,
                    "ca_certs": certifi.where()
                }
            )
        except Exception as e:
            print(f"[AssemblyAI] run_forever error: {e}")
    
    thread = threading.Thread(target=run_ws, daemon=True)
    thread.start()
    
    # Wait briefly for connection to establish
    time.sleep(0.5)
    
    return ws


@socketio.on('connect')
def handle_connect():
    print(f"[Client] Connected: {request.sid}")
    emit('connected', {'status': 'ok'})


@socketio.on('disconnect')
def handle_disconnect():
    from flask import request
    client_sid = request.sid
    print(f"[Client] Disconnected: {client_sid}")
    
    # Clean up AssemblyAI connection if exists
    if client_sid in assemblyai_connections:
        try:
            # Send terminate message to AssemblyAI
            ws = assemblyai_connections[client_sid]
            if ws.sock and ws.sock.connected:
                ws.send(json.dumps({"type": "terminate"}))
            ws.close()
        except Exception as e:
            print(f"[Cleanup] Error closing connection: {e}")
        finally:
            del assemblyai_connections[client_sid]
    
    # Clean up ready state
    if client_sid in connection_ready:
        del connection_ready[client_sid]


@socketio.on('start_transcription')
def handle_start_transcription(data):
    """Start a new transcription session with AssemblyAI"""
    from flask import request
    client_sid = request.sid
    
    sample_rate = data.get('sample_rate', 16000) if data else 16000
    
    print(f"[Client {client_sid}] Starting transcription (sample_rate={sample_rate})")
    
    if not ASSEMBLYAI_API_KEY:
        emit('error', {'message': 'AssemblyAI API key not configured'})
        return
    
    # Close existing connection if any
    if client_sid in assemblyai_connections:
        try:
            assemblyai_connections[client_sid].close()
        except:
            pass
        del assemblyai_connections[client_sid]
    
    # Create new AssemblyAI connection with speaker labels
    ws = create_assemblyai_connection(client_sid, sample_rate)
    assemblyai_connections[client_sid] = ws
    
    emit('transcription_started', {
        'status': 'connecting',
        'speaker_labels': True
    })


@socketio.on('audio_data')
def handle_audio_data(data):
    """Forward audio data to AssemblyAI as binary PCM"""
    from flask import request
    client_sid = request.sid
    
    if client_sid not in assemblyai_connections:
        return
    
    ws = assemblyai_connections[client_sid]
    
    try:
        if ws.sock and ws.sock.connected:
            # Data should be base64 encoded PCM16 audio
            if isinstance(data, dict) and 'audio' in data:
                audio_base64 = data['audio']
            elif isinstance(data, str):
                audio_base64 = data
            else:
                print(f"[Audio] Unknown data format: {type(data)}")
                return
            
            audio_bytes = base64.b64decode(audio_base64)
            
            # AssemblyAI v3 expects raw binary audio data
            ws.send(audio_bytes, opcode=websocket.ABNF.OPCODE_BINARY)
            
    except Exception as e:
        print(f"[Audio] Send error: {e}")
        emit('error', {'message': f'Audio send error: {str(e)}'})


@socketio.on('stop_transcription')
def handle_stop_transcription():
    """Stop transcription and close AssemblyAI connection gracefully"""
    from flask import request
    client_sid = request.sid
    
    print(f"[Client {client_sid}] Stopping transcription")
    
    if client_sid in assemblyai_connections:
        try:
            ws = assemblyai_connections[client_sid]
            # Send terminate message to AssemblyAI
            if ws.sock and ws.sock.connected:
                ws.send(json.dumps({"type": "terminate"}))
                time.sleep(0.1)  # Brief pause for graceful close
            ws.close()
        except Exception as e:
            print(f"[Stop] Error: {e}")
        finally:
            del assemblyai_connections[client_sid]
    
    if client_sid in connection_ready:
        del connection_ready[client_sid]
    
    emit('transcription_stopped', {'status': 'stopped'})


if __name__ == '__main__':
    print(f"[WebSocket Server] Starting on port 5002")
    print(f"[WebSocket Server] AssemblyAI configured: {bool(ASSEMBLYAI_API_KEY)}")
    socketio.run(app, host='0.0.0.0', port=5002, debug=True)
