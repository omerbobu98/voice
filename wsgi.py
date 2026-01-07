import os
import sys

# Print startup info for debugging
print(f"[wsgi] Python version: {sys.version}")
print(f"[wsgi] Current directory: {os.getcwd()}")
print(f"[wsgi] PORT: {os.getenv('PORT', 'not set')}")

# Import the app
from app import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
