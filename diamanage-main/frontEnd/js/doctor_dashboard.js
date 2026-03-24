//VARIABLES
const API_BASE = "https://diamanage.onrender.com/api";

const doctorId = sessionStorage.getItem("userId");
const doctorName = sessionStorage.getItem("userName");
const userRole = sessionStorage.getItem("userRole");

const doctorGreeting = document.getElementById("doctorGreeting");
const search = document.getElementById("search");
const patientList = document.getElementById("patientList");

const emptyState = document.getElementById("emptyState");
const patientPanel = document.getElementById("patientPanel");

const patientName = document.getElementById("patientName");
const patientMeta = document.getElementById("patientMeta");

const logoutBtn = document.getElementById("logoutBtn");

// summary cards
const latestGlucose = document.getElementById("latestGlucose");
const latestGlucoseTime = document.getElementById("latestGlucoseTime");
const latestBp = document.getElementById("latestBp");
const latestBpTime = document.getElementById("latestBpTime");
const latestHeartRate = document.getElementById("latestHeartRate");
const latestHeartRateTime = document.getElementById("latestHeartRateTime");

// glucose
const glucoseTable = document.getElementById("glucoseTable");
const glucoseEmpty = document.getElementById("glucoseEmpty");
const glucoseChartWrap = document.getElementById("glucoseChartWrap");
const glucoseTableWrap = document.getElementById("glucoseTableWrap");
const showGlucoseChartBtn = document.getElementById("showGlucoseChartBtn");
const showGlucoseTableBtn = document.getElementById("showGlucoseTableBtn");
const glucoseChartCanvas = document.getElementById("glucoseChart");

// blood pressure
const bpTable = document.getElementById("bpTable");
const bpEmpty = document.getElementById("bpEmpty");
const bpChartWrap = document.getElementById("bpChartWrap");
const bpTableWrap = document.getElementById("bpTableWrap");
const showBpChartBtn = document.getElementById("showBpChartBtn");
const showBpTableBtn = document.getElementById("showBpTableBtn");
const bpChartCanvas = document.getElementById("bpChart");

// heart rate
const hrTable = document.getElementById("hrTable");
const hrEmpty = document.getElementById("hrEmpty");
const hrChartWrap = document.getElementById("hrChartWrap");
const hrTableWrap = document.getElementById("hrTableWrap");
const showHrChartBtn = document.getElementById("showHrChartBtn");
const showHrTableBtn = document.getElementById("showHrTableBtn");
const hrChartCanvas = document.getElementById("hrChart");

// add patient
const toggleAddPatientBtn = document.getElementById("toggleAddPatientBtn");
const addPatientForm = document.getElementById("addPatientForm");
const savePatientBtn = document.getElementById("savePatientBtn");
const cancelPatientBtn = document.getElementById("cancelPatientBtn");
const addPatientMessage = document.getElementById("addPatientMessage");
const patientEmailInput = document.getElementById("patientEmailInput");

// export
const openExportModalBtn = document.getElementById("openExportModalBtn");
const exportModal = document.getElementById("exportModal");
const exportFormat = document.getElementById("exportFormat");
const exportMetric = document.getElementById("exportMetric");
const exportRange = document.getElementById("exportRange");
const downloadExportBtn = document.getElementById("downloadExportBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");

// tasks
const toggleTaskFormBtn = document.getElementById("toggleTaskFormBtn");
const addTaskForm = document.getElementById("addTaskForm");
const taskDescriptionInput = document.getElementById("taskDescriptionInput");
const taskMandatorySelect = document.getElementById("taskMandatorySelect");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const taskFormMessage = document.getElementById("taskFormMessage");
const doctorTasksEmpty = document.getElementById("doctorTasksEmpty");
const doctorTasksList = document.getElementById("doctorTasksList");

let allPatients = [];
let selectedPatientId = null;

let glucoseChart = null;
let bpChart = null;
let hrChart = null;

let currentGlucoseRecords = [];
let currentBpRecords = [];
let currentHrRecords = [];

let currentTasks = [];


//logged in check
if (!doctorId || userRole !== "DOCTOR") {
  alert("Please log in as a doctor.");
  window.location.href = "login.html";
}

doctorGreeting.textContent = `Hi Dr ${doctorName || ""}.`;

//set logout button
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.location.href = "login.html";
});

//format the date and time
function formatDateOnly(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  });
}

function formatDateAndTime(dateString) {
  const d = new Date(dateString);

  const datePart = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });

  return { datePart, timePart };
}

function getRecordTime(record) {
  return record.recordTime || record.timestamp || record.createdAt || record.dateTime;
}

function sortByNewest(records) {
  return [...records].sort((a, b) => new Date(getRecordTime(b)) - new Date(getRecordTime(a)));
}

function sortByOldest(records) {
  return [...records].sort((a, b) => new Date(getRecordTime(a)) - new Date(getRecordTime(b)));
}

function resetSummaryCards() {
  latestGlucose.textContent = "--";
  latestGlucoseTime.textContent = "No data yet";

  latestBp.textContent = "-- / --";
  latestBpTime.textContent = "No data yet";

  latestHeartRate.textContent = "--";
  latestHeartRateTime.textContent = "No data yet";
}

function updateSummaryCards() {
  const newestGlucose = sortByNewest(currentGlucoseRecords)[0];
  const newestBp = sortByNewest(currentBpRecords)[0];
  const newestHr = sortByNewest(currentHrRecords)[0];

  if (newestGlucose) {
    latestGlucose.textContent = newestGlucose.value ?? "--";
    latestGlucoseTime.textContent = formatDateAndTime(getRecordTime(newestGlucose)).datePart;
  }

  if (newestBp) {
    const systolic = newestBp.systolic ?? "--";
    const diastolic = newestBp.diastolic ?? "--";
    latestBp.textContent = `${systolic} / ${diastolic}`;
    latestBpTime.textContent = formatDateAndTime(getRecordTime(newestBp)).datePart;
  }

  if (newestHr) {
    const value = newestHr.heartRate ?? newestHr.value ?? "--";
    latestHeartRate.textContent = value;
    latestHeartRateTime.textContent = formatDateAndTime(getRecordTime(newestHr)).datePart;
  }
}

async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/doctor-patient/patients/${doctorId}`);
    const links = await res.json();

    const patients = [];

    for (const link of links) {
      const patientId = link.patientId;

      const userRes = await fetch(`${API_BASE}/user/${patientId}`);
      const userData = await userRes.json();

      const name = userData.success ? userData.name : "Patient";

      patients.push({
        patientId,
        name
      });
    }

    allPatients = patients;
    renderPatientList();
  } catch (err) {
    console.error("Failed to load patients:", err);
    patientList.innerHTML = `<li class="empty">Could not load patients.</li>`;
  }
}

function renderPatientList(filterText = "") {
  const q = filterText.trim().toLowerCase();

  const filtered = allPatients.filter((p) =>
    p.name.toLowerCase().includes(q)
  );

  patientList.innerHTML = "";

  if (!filtered.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No patients found.";
    patientList.appendChild(li);
    return;
  }

  filtered.forEach((p) => {
    const li = document.createElement("li");

    li.className =
      "patient-item" + (p.patientId === selectedPatientId ? " active" : "");

    li.innerHTML = `<div style="font-weight:900;">${p.name}</div>`;

    li.addEventListener("click", () => selectPatient(p));

    patientList.appendChild(li);
  });
}

async function selectPatient(patient) {
  selectedPatientId = patient.patientId;

  renderPatientList(search.value);

  emptyState.style.display = "none";
  patientPanel.style.display = "block";

  patientName.textContent = patient.name;
  patientMeta.textContent = "Health overview";

  resetSummaryCards();

  await Promise.all([
    loadGlucose(patient.patientId),
    loadBloodPressure(patient.patientId),
    loadHeartRate(patient.patientId),
    loadTasks(patient.patientId)
  ]);

  updateSummaryCards();
}

function renderSimpleTable(tbody, rows) {
  tbody.innerHTML = "";
  rows.forEach((html) => {
    const tr = document.createElement("tr");
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderGlucoseTable(records) {
  const sorted = sortByNewest(records);

  const rows = sorted.map((record) => {
    const value = record.value ?? "-";
    const recordTime = getRecordTime(record);
    const { datePart, timePart } = formatDateAndTime(recordTime);

    return `
      <td>
        <div style="font-weight:700">${datePart}</div>
        <div style="font-size:0.85rem;color:var(--muted)">${timePart}</div>
      </td>
      <td>${value}</td>
    `;
  });

  renderSimpleTable(glucoseTable, rows);
}

function renderBpTable(records) {
  const sorted = sortByNewest(records);

  const rows = sorted.map((record) => {
    const recordTime = getRecordTime(record);
    const { datePart, timePart } = formatDateAndTime(recordTime);

    return `
      <td>
        <div style="font-weight:700">${datePart}</div>
        <div style="font-size:0.85rem;color:var(--muted)">${timePart}</div>
      </td>
      <td>${record.systolic ?? "-"}</td>
      <td>${record.diastolic ?? "-"}</td>
    `;
  });

  renderSimpleTable(bpTable, rows);
}

function renderHrTable(records) {
  const sorted = sortByNewest(records);

  const rows = sorted.map((record) => {
    const recordTime = getRecordTime(record);
    const { datePart, timePart } = formatDateAndTime(recordTime);
    const value = record.heartRate ?? record.value ?? "-";

    return `
      <td>
        <div style="font-weight:700">${datePart}</div>
        <div style="font-size:0.85rem;color:var(--muted)">${timePart}</div>
      </td>
      <td>${value}</td>
    `;
  });

  renderSimpleTable(hrTable, rows);
}

function renderGlucoseChart(records) {
  if (glucoseChart) {
    glucoseChart.destroy();
  }

  const sorted = sortByOldest(records);
  const labels = sorted.map(r => formatDateOnly(getRecordTime(r)));
  const values = sorted.map(r => r.value);

  glucoseChart = new Chart(glucoseChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Glucose (mmol/L)",
        data: values,
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function renderBpChart(records) {
  if (bpChart) {
    bpChart.destroy();
  }

  const sorted = sortByOldest(records);
  const labels = sorted.map(r => formatDateOnly(getRecordTime(r)));
  const systolicValues = sorted.map(r => r.systolic);
  const diastolicValues = sorted.map(r => r.diastolic);

  bpChart = new Chart(bpChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Systolic",
          data: systolicValues,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: "Diastolic",
          data: diastolicValues,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function renderHrChart(records) {
  if (hrChart) {
    hrChart.destroy();
  }

  const sorted = sortByOldest(records);
  const labels = sorted.map(r => formatDateOnly(getRecordTime(r)));
  const values = sorted.map(r => r.heartRate ?? r.value);

  hrChart = new Chart(hrChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Heart Rate (bpm)",
        data: values,
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

async function loadGlucose(patientId) {
  try {
    const res = await fetch(`${API_BASE}/glucose/list/${patientId}`);
    const records = await res.json();
    currentGlucoseRecords = Array.isArray(records) ? records : [];

    if (!currentGlucoseRecords.length) {
      glucoseEmpty.style.display = "block";
      glucoseChartWrap.style.display = "none";
      glucoseTableWrap.style.display = "none";

      if (glucoseChart) {
        glucoseChart.destroy();
        glucoseChart = null;
      }
      return;
    }

    glucoseEmpty.style.display = "none";
    renderGlucoseTable(currentGlucoseRecords);
    renderGlucoseChart(currentGlucoseRecords);

    glucoseChartWrap.style.display = "block";
    glucoseTableWrap.style.display = "none";
  } catch (err) {
    console.error("Failed to load glucose records:", err);
    currentGlucoseRecords = [];
    glucoseEmpty.style.display = "block";
    glucoseChartWrap.style.display = "none";
    glucoseTableWrap.style.display = "none";
  }
}

async function loadBloodPressure(patientId) {
  try {
    const res = await fetch(`${API_BASE}/blood-pressure/list/${patientId}`);
    const records = await res.json();
    currentBpRecords = Array.isArray(records) ? records : [];

    if (!currentBpRecords.length) {
      bpEmpty.style.display = "block";
      bpChartWrap.style.display = "none";
      bpTableWrap.style.display = "none";

      if (bpChart) {
        bpChart.destroy();
        bpChart = null;
      }
      return;
    }

    bpEmpty.style.display = "none";
    renderBpTable(currentBpRecords);
    renderBpChart(currentBpRecords);

    bpChartWrap.style.display = "block";
    bpTableWrap.style.display = "none";
  } catch (err) {
    console.error("Failed to load blood pressure records:", err);
    currentBpRecords = [];
    bpEmpty.style.display = "block";
    bpChartWrap.style.display = "none";
    bpTableWrap.style.display = "none";
  }
}

async function loadHeartRate(patientId) {
  try {
    const res = await fetch(`${API_BASE}/heartrate/list/${patientId}`);
    const data = await res.json();

    console.log("Heart rate API response:", data);

    const records =
      Array.isArray(data) ? data :
      Array.isArray(data.data) ? data.data :
      Array.isArray(data.records) ? data.records :
      Array.isArray(data.heartRates) ? data.heartRates :
      [];

    currentHrRecords = records;

    if (!currentHrRecords.length) {
      hrEmpty.style.display = "block";
      hrChartWrap.style.display = "none";
      hrTableWrap.style.display = "none";

      if (hrChart) {
        hrChart.destroy();
        hrChart = null;
      }
      return;
    }

    hrEmpty.style.display = "none";
    renderHrTable(currentHrRecords);
    renderHrChart(currentHrRecords);

    hrChartWrap.style.display = "block";
    hrTableWrap.style.display = "none";
  } catch (err) {
    console.error("Failed to load heart rate records:", err);
    currentHrRecords = [];
    hrEmpty.style.display = "block";
    hrChartWrap.style.display = "none";
    hrTableWrap.style.display = "none";
  }
}

showGlucoseChartBtn.addEventListener("click", () => {
  glucoseChartWrap.style.display = currentGlucoseRecords.length ? "block" : "none";
  glucoseTableWrap.style.display = "none";
});

showGlucoseTableBtn.addEventListener("click", () => {
  glucoseTableWrap.style.display = currentGlucoseRecords.length ? "block" : "none";
  glucoseChartWrap.style.display = "none";
});

showBpChartBtn.addEventListener("click", () => {
  bpChartWrap.style.display = currentBpRecords.length ? "block" : "none";
  bpTableWrap.style.display = "none";
});

showBpTableBtn.addEventListener("click", () => {
  bpTableWrap.style.display = currentBpRecords.length ? "block" : "none";
  bpChartWrap.style.display = "none";
});

showHrChartBtn.addEventListener("click", () => {
  hrChartWrap.style.display = currentHrRecords.length ? "block" : "none";
  hrTableWrap.style.display = "none";
});

showHrTableBtn.addEventListener("click", () => {
  hrTableWrap.style.display = currentHrRecords.length ? "block" : "none";
  hrChartWrap.style.display = "none";
});

search.addEventListener("input", () => {
  renderPatientList(search.value);
});

function setupAddPatient() {
  toggleAddPatientBtn.addEventListener("click", () => {
    addPatientForm.style.display =
      addPatientForm.style.display === "none" ? "grid" : "none";

    addPatientMessage.textContent = "";
  });

  cancelPatientBtn.addEventListener("click", () => {
    addPatientForm.style.display = "none";
    patientEmailInput.value = "";
    addPatientMessage.textContent = "";
  });

  savePatientBtn.addEventListener("click", async () => {
    const email = patientEmailInput.value.trim().toLowerCase();

    if (!email) {
      addPatientMessage.textContent = "Enter a valid patient email.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/doctor-patient/link-by-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          doctorId: Number(doctorId),
          patientEmail: email
        })
      });

      const data = await res.json();

      if (!data.success) {
        addPatientMessage.textContent = data.message || "Could not link patient.";
        return;
      }

      addPatientMessage.textContent = "Patient linked successfully.";
      patientEmailInput.value = "";

      await loadPatients();

      setTimeout(() => {
        addPatientForm.style.display = "none";
        addPatientMessage.textContent = "";
      }, 1000);
    } catch (err) {
      console.error(err);
      addPatientMessage.textContent = "Could not link patient.";
    }
  });
}

function setupExportModal() {
  if (openExportModalBtn) {
    openExportModalBtn.addEventListener("click", () => {
      if (!selectedPatientId) {
        alert("Select a patient first.");
        return;
      }

      exportModal.style.display = "flex";
    });
  }

  if (cancelExportBtn) {
    cancelExportBtn.addEventListener("click", () => {
      exportModal.style.display = "none";
    });
  }

  if (exportModal) {
    exportModal.addEventListener("click", (e) => {
      if (e.target === exportModal) {
        exportModal.style.display = "none";
      }
    });
  }

  if (downloadExportBtn) {
    downloadExportBtn.addEventListener("click", () => {
      if (!selectedPatientId) {
        alert("Select a patient first.");
        return;
      }

      const format = exportFormat.value;
      const metric = exportMetric.value;
      const range = exportRange.value;

      if (format === "csv") {
        exportPatientCsv(metric, range);
      } else {
        exportPatientNotes(metric, range);
      }

      exportModal.style.display = "none";
    });
  }
}

function getFilteredRecords(records, range) {
  if (!Array.isArray(records)) return [];

  if (range === "all") {
    return [...records];
  }

  const days = Number(range);
  if (Number.isNaN(days)) {
    return [...records];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return records.filter((record) => {
    const recordTime = getRecordTime(record);
    if (!recordTime) return false;
    return new Date(recordTime) >= cutoff;
  });
}

function formatExportDateTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString();
}

function safeFileName(name) {
  return (name || "patient")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function getMetricLabel(metric) {
  if (metric === "glucose") return "glucose";
  if (metric === "bp") return "blood-pressure";
  if (metric === "hr") return "heart-rate";
  return "all-biomarkers";
}

function getRangeLabel(range) {
  if (range === "7") return "7-days";
  if (range === "30") return "30-days";
  if (range === "365") return "1-year";
  return "all-time";
}

function exportPatientCsv(metric, range) {
  const glucoseRecords = getFilteredRecords(currentGlucoseRecords, range);
  const bpRecords = getFilteredRecords(currentBpRecords, range);
  const hrRecords = getFilteredRecords(currentHrRecords, range);

  const rows = [
    ["Type", "Glucose", "Systolic", "Diastolic", "HeartRate", "DateTime"]
  ];

  if (metric === "all" || metric === "glucose") {
    glucoseRecords.forEach((record) => {
      rows.push([
        "Glucose",
        record.value ?? "",
        "",
        "",
        "",
        formatExportDateTime(getRecordTime(record))
      ]);
    });
  }

  if (metric === "all" || metric === "bp") {
    bpRecords.forEach((record) => {
      rows.push([
        "Blood Pressure",
        "",
        record.systolic ?? "",
        record.diastolic ?? "",
        "",
        formatExportDateTime(getRecordTime(record))
      ]);
    });
  }

  if (metric === "all" || metric === "hr") {
    hrRecords.forEach((record) => {
      rows.push([
        "Heart Rate",
        "",
        "",
        "",
        record.heartRate ?? record.value ?? record.bpm ?? "",
        formatExportDateTime(getRecordTime(record))
      ]);
    });
  }

  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const fileName = `${safeFileName(patientName.textContent)}-${getMetricLabel(metric)}-${getRangeLabel(range)}.csv`;
  downloadFile(csv, fileName, "text/csv;charset=utf-8;");
}

function exportPatientNotes(metric, range) {
  const glucoseRecords = sortByNewest(getFilteredRecords(currentGlucoseRecords, range));
  const bpRecords = sortByNewest(getFilteredRecords(currentBpRecords, range));
  const hrRecords = sortByNewest(getFilteredRecords(currentHrRecords, range));

  const latestGlucoseRecord = glucoseRecords[0];
  const latestBpRecord = bpRecords[0];
  const latestHrRecord = hrRecords[0];

  let notes = `
Patient Summary
===============
Patient: ${patientName.textContent}
Exported: ${new Date().toLocaleString()}
Metric Exported: ${metric === "all" ? "All biomarkers" : metric === "glucose" ? "Glucose" : metric === "bp" ? "Blood Pressure" : "Heart Rate"}
Time Range: ${range === "all" ? "All time" : `Last ${range} days`}
`.trim();

  if (metric === "all" || metric === "glucose") {
    notes += `

Latest Glucose: ${latestGlucoseRecord ? (latestGlucoseRecord.value ?? "--") : "--"}

Glucose Records
---------------
${glucoseRecords.length
  ? glucoseRecords
      .map((r) => `${formatExportDateTime(getRecordTime(r))} - ${r.value ?? "-"}`)
      .join("\n")
  : "No glucose records"}
`;
  }

  if (metric === "all" || metric === "bp") {
    notes += `

Latest Blood Pressure: ${latestBpRecord ? `${latestBpRecord.systolic ?? "--"}/${latestBpRecord.diastolic ?? "--"}` : "--/--"}

Blood Pressure Records
----------------------
${bpRecords.length
  ? bpRecords
      .map((r) => `${formatExportDateTime(getRecordTime(r))} - ${r.systolic ?? "-"}/${r.diastolic ?? "-"}`)
      .join("\n")
  : "No blood pressure records"}
`;
  }

  if (metric === "all" || metric === "hr") {
    notes += `

Latest Heart Rate: ${latestHrRecord ? (latestHrRecord.heartRate ?? latestHrRecord.value ?? latestHrRecord.bpm ?? "--") : "--"}

Heart Rate Records
------------------
${hrRecords.length
  ? hrRecords
      .map((r) => `${formatExportDateTime(getRecordTime(r))} - ${r.heartRate ?? r.value ?? r.bpm ?? "-"}`)
      .join("\n")
  : "No heart rate records"}
`;
  }

  const fileName = `${safeFileName(patientName.textContent)}-${getMetricLabel(metric)}-${getRangeLabel(range)}.txt`;
  downloadFile(notes, fileName, "text/plain;charset=utf-8;");
}

//tasks
function renderDoctorTasks(tasks) {
  doctorTasksList.innerHTML = "";

  if (!Array.isArray(tasks) || !tasks.length) {
    doctorTasksEmpty.style.display = "block";
    return;
  }

  doctorTasksEmpty.style.display = "none";

  tasks.forEach((task) => {
    const card = document.createElement("div");
    const isMandatory = task.mandatory ?? task.isMandatory ?? false;
    const isCompleted = task.completed ?? task.isCompleted ?? false;
    const createdAt = task.recordTime || task.createdAt || task.timestamp;

    card.className = "summary-card";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <div style="font-weight:800; margin-bottom:6px;">${task.description ?? "-"}</div>
          <div class="muted" style="font-size:0.9rem;">
            ${isMandatory ? "Mandatory" : "Optional"} • ${isCompleted ? "Completed" : "Not completed"}
          </div>
          <div class="muted" style="font-size:0.85rem; margin-top:4px;">
            ${createdAt ? formatDateAndTime(createdAt).datePart : ""}
          </div>
        </div>
        <span style="
          font-size:0.8rem;
          font-weight:800;
          padding:6px 10px;
          border-radius:999px;
          background:${isMandatory ? "rgba(220,38,38,0.10)" : "rgba(31,127,191,0.10)"};
          color:${isMandatory ? "#b91c1c" : "#1f4f8f"};
          white-space:nowrap;
        ">
          ${isMandatory ? "Mandatory" : "Optional"}
        </span>
      </div>
    `;

    doctorTasksList.appendChild(card);
  });
}

async function loadTasks(patientId) {
  try {
    const res = await fetch(`${API_BASE}/task/user/${patientId}`);
    const records = await res.json();

    currentTasks = Array.isArray(records) ? records : [];

    renderDoctorTasks(currentTasks);
  } catch (err) {
    console.error("Failed to load tasks:", err);
    currentTasks = [];
    renderDoctorTasks([]);
  }
}

function setupTaskForm() {
  if (!toggleTaskFormBtn || !addTaskForm || !saveTaskBtn || !cancelTaskBtn) {
    return;
  }

  toggleTaskFormBtn.addEventListener("click", () => {
    if (!selectedPatientId) {
      alert("Select a patient first.");
      return;
    }

    addTaskForm.style.display =
      addTaskForm.style.display === "none" ? "grid" : "none";

    taskFormMessage.textContent = "";
  });

  cancelTaskBtn.addEventListener("click", () => {
    addTaskForm.style.display = "none";
    taskDescriptionInput.value = "";
    taskMandatorySelect.value = "true";
    taskFormMessage.textContent = "";
  });

  saveTaskBtn.addEventListener("click", async () => {
    if (!selectedPatientId) {
      taskFormMessage.textContent = "Select a patient first.";
      return;
    }

    const description = taskDescriptionInput.value.trim();
    const mandatory = taskMandatorySelect.value === "true";

    if (!description) {
      taskFormMessage.textContent = "Enter a task description.";
      return;
    }

    saveTaskBtn.disabled = true;
    taskFormMessage.textContent = "Saving task...";

    try {
      const res = await fetch(`${API_BASE}/task/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: Number(selectedPatientId),
          description: description,
          mandatory: mandatory,
          createdByRole: "DOCTOR"
        })
      });

      const data = await res.json();

      if (!data.success) {
        taskFormMessage.textContent = data.message || "Could not save task.";
        saveTaskBtn.disabled = false;
        return;
      }

      taskFormMessage.textContent = "Task saved successfully.";
      taskDescriptionInput.value = "";
      taskMandatorySelect.value = "true";

      await loadTasks(selectedPatientId);

      setTimeout(() => {
        addTaskForm.style.display = "none";
        taskFormMessage.textContent = "";
      }, 900);
    } catch (err) {
      console.error("Failed to save task:", err);
      taskFormMessage.textContent = "Could not save task.";
    } finally {
      saveTaskBtn.disabled = false;
    }
  });
}

setupAddPatient();
setupExportModal();
setupTaskForm();
resetSummaryCards();
loadPatients();
