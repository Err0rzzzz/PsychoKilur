from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from psychopy import visual, core, event, monitors
from math import tan, radians, ceil
import time

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as necessary for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

win = None
monitor_params = None

class MonitorParams(BaseModel):
    distance: float
    width: float
    hres: int
    vres: int

class GratingParams(BaseModel):
    start_delay: float
    sessions: int
    reversals: int
    frequency: float
    orientation: float
    contrast: float
    inter_session_length: float
    spatial_freq: float
    phase: float

class CheckerboardParams(BaseModel):
    start_delay: float
    contrast: float
    spatial_freq: float
    duration: float

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/set_monitor")
async def set_monitor(params: MonitorParams):
    global monitor_params
    monitor_params = params
    return JSONResponse(content={"status": "success", "message": "Monitor settings saved successfully"})

@app.post("/run_grating_stimulus")
async def run_grating_stimulus(params: GratingParams):
    global win, monitor_params
    try:
        if win is not None:
            try:
                win.close()
            except Exception as e:
                print(f"Error closing window: {e}")
            win = None
        if monitor_params is None:
            raise HTTPException(status_code=400, detail="Monitor settings not set")

        mon = monitors.Monitor(name='BIT Perceptual Learning Program', distance=monitor_params.distance, width=monitor_params.width)
        mon.currentCalib['sizePix'] = [monitor_params.hres, monitor_params.vres]
        mon.saveMon()
        win = visual.Window(fullscr=True, color=[1, 1, 1], allowGUI=False, units='deg', monitor=mon, screen=1)
        win_size = win.size

        stimulus = visual.GratingStim(win, tex='sin', mask=None, pos=[0, 0], size=win_size, sf=params.spatial_freq, ori=params.orientation, contrast=params.contrast)
        fixation = visual.GratingStim(win, size=win_size, pos=[0, 0], sf=0, color='gray')

        # Show fixation before starting the stimulus
        fixation.draw()
        win.flip()
        core.wait(params.start_delay)

        for session in range(params.sessions):
            for _ in range(params.reversals):
                stimulus.phase += params.phase  # Increment phase for drifting effect
                stimulus.draw()
                win.flip()
                core.wait(1.0 / params.frequency)
                if event.getKeys(keyList=['escape']):
                    win.close()
                    return JSONResponse(content={"status": "aborted", "message": "Stimulus run aborted"})
            # Show fixation during inter-session period
            fixation.draw()
            win.flip()
            core.wait(params.inter_session_length)

        # Show fixation at the end and wait for escape key to exit
        fixation.draw()
        win.flip()
        while True:
            if event.getKeys(keyList=['escape']):
                break
            core.wait(0.1)

        win.close()
        return JSONResponse(content={"status": "success", "message": "Grating stimulus displayed successfully"})
    except Exception as e:
        if win is not None:
            try:
                win.close()
            except Exception as ex:
                print(f"Error closing window during exception: {ex}")
            win = None
        return JSONResponse(content={"status": "error", "message": str(e)})

@app.post("/run_checkerboard_stimulus")
async def run_checkerboard_stimulus(params: CheckerboardParams):
    global win, monitor_params
    try:
        if win is not None:
            try:
                win.close()
            except Exception as e:
                print(f"Error closing window: {e}")
            win = None
        if monitor_params is None:
            raise HTTPException(status_code=400, detail="Monitor settings not set")

        mon = monitors.Monitor(name='BIT Perceptual Learning Program', distance=monitor_params.distance, width=monitor_params.width)
        mon.currentCalib['sizePix'] = [monitor_params.hres, monitor_params.vres]
        mon.saveMon()
        win = visual.Window(fullscr=True, color=[1, 1, 1], allowGUI=False, units='pix', monitor=mon, screen=1)
        win_size = win.size

        # Calculate the size of each square in pixels
        visual_angle = 1 / params.spatial_freq
        size_deg = visual_angle / 2
        size_cm = 2 * tan(radians(size_deg / 2)) * monitor_params.distance
        size_pix = (size_cm / monitor_params.width) * monitor_params.hres

        fixation = visual.GratingStim(win, size=win_size, pos=[0, 0], sf=0, color='gray')

        # Show fixation before starting the stimulus
        fixation.draw()
        win.flip()
        core.wait(params.start_delay)

        # Calculate the number of rows and columns
        rows = ceil(win_size[1] / size_pix) + 1
        cols = ceil(win_size[0] / size_pix) + 1

        # Pre-calculate positions and colors to optimize the drawing loop
        squares = []
        for row in range(rows):
            for col in range(cols):
                color = 'white' if (row + col) % 2 == 0 else 'black'
                pos = ((col - cols // 2) * size_pix, (row - rows // 2) * size_pix)
                squares.append((pos, color))

        for pos, color in squares:
            rect = visual.Rect(win, width=size_pix, height=size_pix, fillColor=color, contrast=params.contrast)
            rect.pos = pos
            rect.draw()

        win.flip()

        if event.getKeys(keyList=['escape']):
            win.close()
            return JSONResponse(content={"status": "aborted", "message": "Stimulus run aborted"})
        core.wait(params.duration)

        # Show fixation at the end and wait for escape key to exit
        fixation.draw()
        win.flip()
        while True:
            if event.getKeys(keyList=['escape']):
                break
            core.wait(0.1)

        win.close()
        return JSONResponse(content={"status": "success", "message": "Checkerboard stimulus displayed successfully"})
    except Exception as e:
        if win is not None:
            try:
                win.close()
            except Exception as ex:
                print(f"Error closing window during exception: {ex}")
            win = None
        return JSONResponse(content={"status": "error", "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
