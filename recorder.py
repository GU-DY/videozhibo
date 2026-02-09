# -*- encoding: utf-8 -*-
"""
Mock Recorder Script for FinStream Guard Dashboard.
In a production environment, this file would be replaced by the full DouyinLiveRecorder 'main.py' script.
This script simulates the process lifecycle to allow the dashboard backend to manage it.
"""
import sys
import time
import signal
import os

# Flag to control the main loop
running = True

def signal_handler(_signal, _frame):
    """Handle termination signals to exit gracefully."""
    global running
    print("Stopping recorder service...")
    running = False
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def main():
    print(f"DouyinLiveRecorder Mock Service Started (PID: {os.getpid()})")
    print("Monitoring configuration and simulating recording lifecycle...")
    
    # Simulate initialization time
    time.sleep(2)
    
    # Main simulation loop
    while running:
        # In a real scenario, this checks URLs and records streams.
        # Here we just sleep to keep the process alive so the dashboard sees it as "Running".
        try:
            time.sleep(5)
            # Optional: Print a heartbeat log that the backend can read (if implemented)
            # print("Heartbeat: Monitoring active...") 
            sys.stdout.flush()
        except KeyboardInterrupt:
            break
            
    print("Recorder service stopped.")

if __name__ == "__main__":
    main()
