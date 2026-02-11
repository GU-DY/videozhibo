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
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
RECORDER_DIR = os.path.join(ROOT_DIR, "DouyinLiveRecorder-main")
RECORDER_SCRIPT = os.path.join(RECORDER_DIR, "main.py")
CONFIG_FILE = os.path.join(RECORDER_DIR, "config", "URL_config.ini")
DOWNLOAD_DIR = os.path.join(RECORDER_DIR, "downloads")
TEXT_ENCODING = "utf-8-sig"
ANCHOR_TAG = "\u4e3b\u64ad: "
DEFAULT_NAME = "\u672a\u547d\u540d\u4e3b\u64ad"
DEFAULT_QUALITY = "\u539f\u753b"
PID_FILE = os.path.join(BACKEND_DIR, "recorder.pid")
AUTO_STOP_ORPHANS_ON_STARTUP = True

app = FastAPI(title="FinStream Guard Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recorder_process: Optional[subprocess.Popen] = None

# --- Process helpers ---
def _find_recorder_pids_win() -> List[int]:
    try:
        ps_cmd = (
            "Get-CimInstance Win32_Process -Filter \"Name='python.exe' OR Name='pythonw.exe'\" | "
            "Select-Object ProcessId,CommandLine | "
            "ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }"
        )
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
        )
        pids = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t", 1)
            if len(parts) != 2:
                continue
            pid_str, cmdline = parts
            if pid_str.isdigit() and "DouyinLiveRecorder-main" in cmdline:
                pids.append(int(pid_str))
        return pids
    except Exception:
        return []

def _is_pid_alive_win(pid: int) -> bool:
    try:
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
        )
        return str(pid) in result.stdout
    except Exception:
        return False

def _read_pid_file() -> Optional[int]:
    try:
        if os.path.exists(PID_FILE):
            with open(PID_FILE, "r", encoding="utf-8") as f:
                data = f.read().strip()
            if data.isdigit():
                return int(data)
    except Exception:
        return None
    return None

def _write_pid_file(pid: int) -> None:
    try:
        with open(PID_FILE, "w", encoding="utf-8") as f:
            f.write(str(pid))
    except Exception:
        pass

def _clear_pid_file() -> None:
    try:
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
    except Exception:
        pass

def _kill_recorder_pids_win(pids: List[int]) -> None:
    for pid in pids:
        subprocess.run(
            ["taskkill", "/PID", str(pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

@app.on_event("startup")
def _cleanup_orphan_recorder_processes() -> None:
    if sys.platform != "win32":
        return
    pid_file = _read_pid_file()
    if pid_file is not None and not _is_pid_alive_win(pid_file):
        _clear_pid_file()
    if AUTO_STOP_ORPHANS_ON_STARTUP:
        extra_pids = _find_recorder_pids_win()
        if extra_pids:
            _kill_recorder_pids_win(extra_pids)
        _clear_pid_file()


def is_process_alive(proc: Optional[subprocess.Popen]) -> bool:
    if proc is None:
        if sys.platform == "win32":
            pid = _read_pid_file()
            if pid is not None:
                return _is_pid_alive_win(pid)
            return len(_find_recorder_pids_win()) > 0
        return False
    if proc.poll() is not None:
        if sys.platform == "win32":
            pid = _read_pid_file()
            if pid is not None:
                return _is_pid_alive_win(pid)
            return len(_find_recorder_pids_win()) > 0
        return False
    if sys.platform == "win32":
        return _is_pid_alive_win(proc.pid)
    return True

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
        with open(CONFIG_FILE, 'r', encoding=TEXT_ENCODING, errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    urls.append(line)
    return urls

def add_url_to_config(url: str, name: str = ""):
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)

    # Check if exists
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding=TEXT_ENCODING, errors="ignore") as f:
            content = f.read()
            if url in content:
                return

    # Format: url,anchor: name (ANCHOR_TAG is used in the recorder config)
    line_to_add = url
    if name:
        line_to_add = f"{url},{ANCHOR_TAG}{name}"

    with open(CONFIG_FILE, 'a', encoding=TEXT_ENCODING) as f:
        if os.path.getsize(CONFIG_FILE) > 0:
            f.write("\n")
        f.write(line_to_add)

def parse_config_line(line: str):
    """
    Parses a line from URL_config.ini using logic similar to the recorder script.
    Formats supported:
    1. url
    2. url,anchor: name
    3. quality,url,anchor: name
    """
    line = line.strip()
    name = DEFAULT_NAME
    url = ""
    quality = DEFAULT_QUALITY

    # Split by ANCHOR_TAG first as it's a strong delimiter in the original script
    if ANCHOR_TAG in line:
        parts = line.split(ANCHOR_TAG)
        name = parts[1].strip()
        line = parts[0].strip() # Remaining part contains url and maybe quality
        if line.endswith(','): line = line[:-1]

    # Split remaining by comma (ASCII or full-width)
    parts = re.split("[,\uFF0C]", line)
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
            # parts[1] might be name if ANCHOR_TAG wasn't used, but we stick to standard
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
    is_running = is_process_alive(recorder_process)
    pid = recorder_process.pid if recorder_process is not None and recorder_process.poll() is None else None
    if sys.platform == "win32" and pid is None and is_running:
        pid_file = _read_pid_file()
        if pid_file is not None:
            pid = pid_file
        else:
            pids = _find_recorder_pids_win()
            pid = pids[0] if pids else None
    urls = get_configured_urls()
    
    storage = "0 B"
    if os.path.exists(DOWNLOAD_DIR):
        storage = format_bytes(get_dir_size(DOWNLOAD_DIR))

    return SystemStatus(
        recorder_running=is_running,
        pid=pid if is_running else None,
        active_urls=len(urls),
        storage_usage=storage
    )

@app.post("/api/recorder/start")
async def start_recorder():
    global recorder_process
    
    if recorder_process is not None and recorder_process.poll() is None:
        return {"message": "Recorder is already running", "pid": recorder_process.pid}
    if sys.platform == "win32":
        pid_file = _read_pid_file()
        if pid_file is not None and _is_pid_alive_win(pid_file):
            return {"message": "Recorder is already running", "pid": pid_file}
        existing_pids = _find_recorder_pids_win()
        if existing_pids:
            return {"message": "Recorder is already running", "pid": existing_pids[0]}

    if not os.path.exists(RECORDER_SCRIPT):
        raise HTTPException(status_code=500, detail="Recorder script not found.")

    try:
        # We use sys.executable to ensure we use the same python env
        if sys.platform == "win32":
            recorder_process = subprocess.Popen(
                [sys.executable, RECORDER_SCRIPT],
                cwd=RECORDER_DIR,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        else:
            recorder_process = subprocess.Popen(
                [sys.executable, RECORDER_SCRIPT],
                cwd=RECORDER_DIR,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        _write_pid_file(recorder_process.pid)
        return {"message": "Recorder started", "pid": recorder_process.pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recorder/stop")
async def stop_recorder():
    global recorder_process
    if recorder_process is None:
        if sys.platform == "win32":
            pid_file = _read_pid_file()
            extra_pids = [pid_file] if pid_file is not None else _find_recorder_pids_win()
            if not extra_pids:
                return {"message": "Recorder is not running"}
            _kill_recorder_pids_win(extra_pids)
            _clear_pid_file()
            return {"message": "Recorder stopped"}
        return {"message": "Recorder is not running"}

    try:
        if sys.platform == "win32":
            # Try graceful stop first, then enforce stop if still alive.
            recorder_process.terminate()
            try:
                recorder_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                pass
            if is_process_alive(recorder_process):
                # Kill main tree first
                _kill_recorder_pids_win([recorder_process.pid])
                # Then sweep any leftover processes started from recorder directory
                extra_pids = _find_recorder_pids_win()
                _kill_recorder_pids_win(extra_pids)
        else:
            recorder_process.terminate()
            try:
                recorder_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                recorder_process.kill()
    except Exception:
        pass
    
    recorder_process = None
    _clear_pid_file()
    return {"message": "Recorder stopped"}

@app.get("/api/tasks")
async def list_tasks():
    urls = get_configured_urls()
    is_running = is_process_alive(recorder_process)
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
            "status": "RECORDING" if is_running else "OFFLINE"
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
