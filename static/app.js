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
        toggleStimulusForm(stimulusTypeSelect.value);
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

function toggleStimulusForm(type) {
    const gratingParamsForm = document.getElementById("stimulus-settings-form-grating");
    const checkerboardParamsForm = document.getElementById("stimulus-settings-form-checkerboard");

    if (type === "grating") {
        gratingParamsForm.style.display = "block";
        checkerboardParamsForm.style.display = "none";
    } else if (type === "checkerboard") {
        gratingParamsForm.style.display = "none";
        checkerboardParamsForm.style.display = "block";
    }
}

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
            showNotification(data.message);
        }
        toggleMonitorSettings();
        document.querySelector("#stimulus-settings-form-grating button").disabled = false;
        document.querySelector("#stimulus-settings-form-checkerboard button").disabled = false;
    })
    .catch(error => {
        console.error("Error:", error);
        showNotification("An error occurred while setting monitor settings.");
    });
}

function runStimulus(type) {
    console.log("Running stimulus");

    let params = {};

    if (type === "grating") {
        params = getGratingParams();
        fetchStimulus("/run_grating_stimulus", params);
    } else if (type === "checkerboard") {
        params = getCheckerboardParams();
        fetchStimulus("/run_checkerboard_stimulus", params);
    }
}

function getGratingParams() {
    return {
        start_delay: parseFloat(document.getElementById("start_delay_grating").value),
        sessions: parseInt(document.getElementById("sessions_grating").value, 10),
        reversals: parseInt(document.getElementById("reversals_grating").value, 10),
        frequency: parseFloat(document.getElementById("frequency_grating").value),
        orientation: parseFloat(document.getElementById("orientation_grating").value),
        contrast: parseFloat(document.getElementById("contrast_grating").value),
        inter_session_length: parseFloat(document.getElementById("inter_session_length_grating").value),
        spatial_freq: parseFloat(document.getElementById("spatial_freq_grating").value),
        phase: parseFloat(document.getElementById("phase_grating").value),
    };
}

function getCheckerboardParams() {
    return {
        start_delay: parseFloat(document.getElementById("start_delay_checkerboard").value),
        contrast: parseFloat(document.getElementById("contrast_checkerboard").value),
        spatial_freq: parseFloat(document.getElementById("spatial_freq_checkerboard").value),
        duration: parseFloat(document.getElementById("duration_checkerboard").value),
    };
}

function fetchStimulus(url, params) {
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })
    .then(response => response.json())
    .then(data => {
        console.log(`Response from ${url}:`, data);
        showNotification(data.message);
    })
    .catch(error => {
        console.error("Error:", error);
        showNotification("An error occurred while running stimulus.");
    });
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
