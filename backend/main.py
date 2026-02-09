import os
import sys
import subprocess
import signal
import time
import configparser
import re
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# --- Configuration ---
# Point to the recorder script we just saved in root
RECORDER_SCRIPT = "recorder.py" 
CONFIG_FILE = "config/URL_config.ini"
DOWNLOAD_DIR = "downloads"

app = FastAPI(title="FinStream Guard Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recorder_process: Optional[subprocess.Popen] = None

# --- Models ---

class StreamerConfig(BaseModel):
    name: str 
    url: str
    platform: str

class SystemStatus(BaseModel):
    recorder_running: bool
    pid: Optional[int]
    active_urls: int
    storage_usage: str

# --- Helpers ---

def get_configured_urls() -> List[str]:
    urls = []
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    urls.append(line)
    return urls

def add_url_to_config(url: str, name: str = ""):
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    
    # Check if exists
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            if url in content:
                return 

    # Format: url,主播: name  (This matches DouyinLiveRecorder format)
    line_to_add = url
    if name:
        line_to_add = f"{url},主播: {name}"

    with open(CONFIG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n{line_to_add}")

def parse_config_line(line: str):
    """
    Parses a line from URL_config.ini using logic similar to the recorder script.
    Formats supported:
    1. url
    2. url,主播: name
    3. quality,url,主播: name
    """
    line = line.strip()
    name = "未命名主播"
    url = ""
    quality = "原画"

    # Split by '主播: ' first as it's a strong delimiter in the original script
    if '主播: ' in line:
        parts = line.split('主播: ')
        name = parts[1].strip()
        line = parts[0].strip() # Remainng part contains url and maybe quality
        if line.endswith(','): line = line[:-1]

    # Split remaining by comma
    parts = re.split(r'[,，]', line)
    parts = [p.strip() for p in parts if p.strip()]

    if len(parts) == 1:
        if '://' in parts[0]:
            url = parts[0]
        else:
            # Maybe just quality? Unlikely
            pass
    elif len(parts) >= 2:
        if '://' in parts[0]:
            url = parts[0]
            # parts[1] might be name if '主播:' wasn't used, but we stick to standard
        else:
            quality = parts[0]
            url = parts[1]

    # Fallback if url empty
    if not url and '://' in line:
        # Try to find url in the raw line
        match = re.search(r'(https?://[^\s,]+)', line)
        if match:
            url = match.group(1)

    return {
        "name": name,
        "url": url,
        "quality": quality
    }

def get_dir_size(path='.'):
    total = 0
    try:
        with os.scandir(path) as it:
            for entry in it:
                if entry.is_file():
                    total += entry.stat().st_size
                elif entry.is_dir():
                    total += get_dir_size(entry.path)
    except FileNotFoundError:
        return 0
    return total

def format_bytes(size):
    power = 2**10
    n = 0
    power_labels = {0 : '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while size > power:
        size /= power
        n += 1
    return f"{size:.2f} {power_labels[n]}B"

# --- API Endpoints ---

@app.get("/api/status", response_model=SystemStatus)
async def get_status():
    is_running = recorder_process is not None and recorder_process.poll() is None
    urls = get_configured_urls()
    
    storage = "0 B"
    if os.path.exists(DOWNLOAD_DIR):
        storage = format_bytes(get_dir_size(DOWNLOAD_DIR))

    return SystemStatus(
        recorder_running=is_running,
        pid=recorder_process.pid if is_running else None,
        active_urls=len(urls),
        storage_usage=storage
    )

@app.post("/api/recorder/start")
async def start_recorder():
    global recorder_process
    
    if recorder_process is not None and recorder_process.poll() is None:
        return {"message": "Recorder is already running", "pid": recorder_process.pid}

    if not os.path.exists(RECORDER_SCRIPT):
        # Fallback for dev: create a dummy script if not exists
        with open(RECORDER_SCRIPT, 'w') as f:
            f.write("import time\nwhile True:\n  time.sleep(10)")

    try:
        # We use sys.executable to ensure we use the same python env
        if sys.platform == "win32":
            recorder_process = subprocess.Popen(
                [sys.executable, RECORDER_SCRIPT],
                cwd=os.getcwd(),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            recorder_process = subprocess.Popen(
                [sys.executable, RECORDER_SCRIPT],
                cwd=os.getcwd(),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
        return {"message": "Recorder started", "pid": recorder_process.pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recorder/stop")
async def stop_recorder():
    global recorder_process
    if recorder_process is None:
        return {"message": "Recorder is not running"}

    recorder_process.terminate()
    try:
        recorder_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        recorder_process.kill()
    
    recorder_process = None
    return {"message": "Recorder stopped"}

@app.get("/api/tasks")
async def list_tasks():
    urls = get_configured_urls()
    tasks = []
    for idx, line in enumerate(urls):
        parsed = parse_config_line(line)
        if not parsed['url']: continue
        
        # Detect platform
        platform = "Unknown"
        if "douyin" in parsed['url']: platform = "Douyin"
        elif "tiktok" in parsed['url']: platform = "TikTok"
        elif "kuaishou" in parsed['url']: platform = "Kuaishou"

        tasks.append({
            "id": str(idx),
            "url": parsed['url'],
            "name": parsed['name'],
            "platform": platform,
            "status": "RECORDING" if (recorder_process is not None and recorder_process.poll() is None) else "OFFLINE"
        })
    return tasks

@app.post("/api/tasks")
async def add_task(config: StreamerConfig):
    add_url_to_config(config.url, config.name)
    return {"message": "URL added to config."}

@app.get("/api/recordings")
async def list_recordings():
    if not os.path.exists(DOWNLOAD_DIR):
        return []

    files = []
    for root, dirs, filenames in os.walk(DOWNLOAD_DIR):
        for f in filenames:
            if f.endswith(('.ts', '.mp4', '.flv', '.mkv')):
                full_path = os.path.join(root, f)
                stats = os.stat(full_path)
                
                # Try to guess platform and streamer from folder structure
                # Structure usually: downloads/Platform/StreamerName/File
                parts = full_path.split(os.sep)
                streamer_name = "Unknown"
                platform = "Unknown"
                
                if len(parts) >= 3:
                    # simplistic guess
                    streamer_name = parts[-2]
                
                files.append({
                    "id": f,
                    "streamerName": streamer_name,
                    "platform": platform,
                    "startTime": datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                    "duration": "--:--",
                    "size": format_bytes(stats.st_size),
                    "path": full_path,
                    "riskCount": 0 
                })
    return files

if os.path.exists(DOWNLOAD_DIR):
    app.mount("/videos", StaticFiles(directory=DOWNLOAD_DIR), name="videos")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
