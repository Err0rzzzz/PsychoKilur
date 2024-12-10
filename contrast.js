document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    const stimulusTypeSelect = document.getElementById("stimulus_type");
    const gratingParamsForm = document.getElementById("stimulus-settings-form-grating");
    const checkerboardParamsForm = document.getElementById("stimulus-settings-form-checkerboard");
    const runStimulusButtonGrating = document.querySelector("#stimulus-settings-form-grating button");
    const runStimulusButtonCheckerboard = document.querySelector("#stimulus-settings-form-checkerboard button");
    const monitorSettings = document.getElementById("monitor-settings");
    const reeditMonitorSettingsButton = document.getElementById("reedit-monitor-settings");

    stimulusTypeSelect.addEventListener("change", function () {
        if (stimulusTypeSelect.value === "grating") {
            gratingParamsForm.style.display = "block";
            checkerboardParamsForm.style.display = "none";
        } else if (stimulusTypeSelect.value === "checkerboard") {
            gratingParamsForm.style.display = "none";
            checkerboardParamsForm.style.display = "block";
        }
    });

    stimulusTypeSelect.dispatchEvent(new Event("change"));

    runStimulusButtonGrating.disabled = true;
    runStimulusButtonCheckerboard.disabled = true;

    document.getElementById("monitor-settings-form").addEventListener("submit", function (event) {
        event.preventDefault();
        setMonitorSettings();
    });

    reeditMonitorSettingsButton.addEventListener("click", function () {
        monitorSettings.style.display = "block";
        reeditMonitorSettingsButton.style.display = "none";
    });
});

function toggleMonitorSettings() {
    const monitorSettings = document.getElementById("monitor-settings");
    const reeditMonitorSettingsButton = document.getElementById("reedit-monitor-settings");
    monitorSettings.style.display = "none";
    reeditMonitorSettingsButton.style.display = "block";
}

function setMonitorSettings() {
    console.log("Setting monitor settings");

    const distance = parseFloat(document.getElementById("distance").value);
    const width = parseFloat(document.getElementById("width").value);
    const hres = parseInt(document.getElementById("hres").value, 10);
    const vres = parseInt(document.getElementById("vres").value, 10);

    console.log("Monitor settings:", { distance, width, hres, vres });

    fetch("/set_monitor", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ distance, width, hres, vres }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response from /set_monitor:", data);
        if (data.message) {
            alert(data.message);
        }
        toggleMonitorSettings();
        document.querySelector("#stimulus-settings-form-grating button").disabled = false;
        document.querySelector("#stimulus-settings-form-checkerboard button").disabled = false;
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function runStimulus(type) {
    console.log("Running stimulus");

    let params = {};

    if (type === "grating") {
        params.start_delay = parseFloat(document.getElementById("start_delay_grating").value);
        params.sessions = parseInt(document.getElementById("sessions_grating").value, 10);
        params.reversals = parseInt(document.getElementById("reversals_grating").value, 10);
        params.frequency = parseFloat(document.getElementById("frequency_grating").value);
        params.orientation = parseFloat(document.getElementById("orientation_grating").value);
        params.contrast = parseFloat(document.getElementById("contrast_grating").value);
        params.inter_session_length = parseFloat(document.getElementById("inter_session_length_grating").value);
        params.spatial_freq = parseFloat(document.getElementById("spatial_freq_grating").value);
        params.phase = parseFloat(document.getElementById("phase_grating").value);

        fetch("/run_grating_stimulus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response from /run_grating_stimulus:", data);
            alert(data.message);
        })
        .catch(error => {
            console.error("Error:", error);
        });
    } else if (type === "checkerboard") {
        params.start_delay = parseFloat(document.getElementById("start_delay_checkerboard").value);
        params.sessions = parseInt(document.getElementById("sessions_checkerboard").value, 10);
        params.reversals = parseInt(document.getElementById("reversals_checkerboard").value, 10);
        params.frequency = parseFloat(document.getElementById("frequency_checkerboard").value);
        params.contrast = parseFloat(document.getElementById("contrast_checkerboard").value);
        params.square_size = parseInt(document.getElementById("square_size").value, 10);
        params.num_squares = parseInt(document.getElementById("num_squares").value, 10);

        fetch("/run_checkerboard_stimulus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response from /run_checkerboard_stimulus:", data);
            alert(data.message);
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }
}
