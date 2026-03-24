// chart instances (Keep at the top for re rendring)
let glucoseChartInstance = null;
let bpChartInstance = null;
let hrChartInstance = null;


// ---- welcome card ---

export function renderWelcomeCard(name, glucoseRecords, bpRecords, hrRecords) {
  const container = document.getElementById("welcome-card");
  if (!container) return;

  const latestGlucose = getLatest(glucoseRecords, "recordTime");
  const latestBP = getLatest(bpRecords, "recordTime");
  const latestHR = getLatest(hrRecords, "recordTime");

  let badges = "";

  if (latestGlucose) {
    const s = getGlucoseStatus(latestGlucose.value);
    badges += `
      <div class="stat-badge">
        <span class="stat-label">Glucose</span>
        <span class="stat-value">${latestGlucose.value} mmol/L</span>
        <span class="status-pill" style="background:${s.bg}; color:${s.color}; border:1px solid ${s.border};">
          ${s.icon} ${s.label}
        </span>
      </div>`;
  }

  if (latestBP) {
    const s = getBPStatus(latestBP.systolic, latestBP.diastolic);
    badges += `
      <div class="stat-badge">
        <span class="stat-label">Blood Pressure</span>
        <span class="stat-value">${latestBP.systolic}/${latestBP.diastolic} mmHg</span>
        <span class="status-pill" style="background:${s.bg}; color:${s.color}; border:1px solid ${s.border};">
          ${s.icon} ${s.label}
        </span>
      </div>`;
  }

  if (latestHR) {
    const s = getHRStatus(latestHR.heartRate);
    badges += `
      <div class="stat-badge">
        <span class="stat-label">Heart Rate</span>
        <span class="stat-value">${latestHR.heartRate} bpm</span>
        <span class="status-pill" style="background:${s.bg}; color:${s.color}; border:1px solid ${s.border};">
          ${s.icon} ${s.label}
        </span>
      </div>`;
  }

// with no data et
  if (!badges) {
    container.innerHTML = `
      <h2>Hello, ${name}</h2>
      <p style="color:var(--text-secondary); margin-top:6px;">No readings recorded yet. Add your first reading below.</p>
    `;
    return;
  }

  container.innerHTML = `
    <h2 style="margin-bottom:16px;">Hello, ${name}</h2>
    <div class="welcome-stats">${badges}</div>
  `;
}


// status helpers from APP.js

export function getGlucoseStatus(value) {
  if (value < 3.5)   return { label: "Critically Low",  icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
  if (value <= 5.5)  return { label: "Normal",          icon: "🟢", color: "#166534", bg: "rgba(87,179,60,0.10)",  border: "rgba(87,179,60,0.30)" };
  if (value <= 7.8)  return { label: "Elevated",        icon: "🟡", color: "#92400e", bg: "rgba(243,156,18,0.10)", border: "rgba(243,156,18,0.30)" };
  if (value <= 11.0) return { label: "High",            icon: "🟠", color: "#9a3412", bg: "rgba(234,88,12,0.10)",  border: "rgba(234,88,12,0.30)" };
  return               { label: "Critically High", icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
}

export function getBPStatus(systolic, diastolic) {
  if (systolic < 90  || diastolic < 60)  return { label: "Low BP",    icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
  if (systolic <= 120 && diastolic <= 80) return { label: "Normal",   icon: "🟢", color: "#166534", bg: "rgba(87,179,60,0.10)",  border: "rgba(87,179,60,0.30)" };
  if (systolic <= 130 && diastolic <= 80) return { label: "Elevated", icon: "🟡", color: "#92400e", bg: "rgba(243,156,18,0.10)", border: "rgba(243,156,18,0.30)" };
  if (systolic <= 140 || diastolic <= 90) return { label: "High",     icon: "🟠", color: "#9a3412", bg: "rgba(234,88,12,0.10)",  border: "rgba(234,88,12,0.30)" };
  return                                          { label: "Very High",icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
}

export function getHRStatus(bpm) {
  if (bpm < 40)   return { label: "Critically Low", icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
  if (bpm < 60)   return { label: "Low",            icon: "🟡", color: "#92400e", bg: "rgba(243,156,18,0.10)", border: "rgba(243,156,18,0.30)" };
  if (bpm <= 100) return { label: "Normal",         icon: "🟢", color: "#166534", bg: "rgba(87,179,60,0.10)",  border: "rgba(87,179,60,0.30)" };
  if (bpm <= 130) return { label: "Elevated",       icon: "🟡", color: "#92400e", bg: "rgba(243,156,18,0.10)", border: "rgba(243,156,18,0.30)" };
  return            { label: "Very High",           icon: "🔴", color: "#991b1b", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)" };
}

function getLatest(records, timeField) {
  if (!Array.isArray(records) || records.length === 0) return null;
  return [...records].sort((a, b) => new Date(b[timeField]) - new Date(a[timeField]))[0];
}


// --- glucose charts ----

export function renderGlucoseChart(records) {
  const canvas = document.getElementById("glucoseChart");
  if (!canvas) return;

  if (glucoseChartInstance) {
    glucoseChartInstance.destroy();
    glucoseChartInstance = null;
  }

  if (!records || records.length === 0) return;

  const sorted = sortAsc(records, "recordTime");

  glucoseChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: sorted.map(r => fmtLabel(r.recordTime)),
      datasets: [{
        data: sorted.map(r => r.value),
        borderColor: "#27AE60",
        backgroundColor: "rgba(39,174,96,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#27AE60"
      }]
    },
    options: chartOptions("mmol/L")
  });
}

export function renderGlucoseTable(records) {
  const body = document.getElementById("glucoseTableBody");
  if (!body) return;

  body.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    body.innerHTML = `<tr><td colspan="2" style="padding:12px; text-align:center;">No data found.</td></tr>`;
    return;
  }

  sortDesc(records, "recordTime").forEach(r => {
    const { date, time } = fmtDateTime(r.recordTime);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid #eee;">
        <div style="font-weight:600;">${date}</div>
        <div style="font-size:0.9em; color:#666;">${time}</div>
      </td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.value}</td>`;
    body.appendChild(row);
  });
}

export function setGlucoseView(view, records) {
  const chart = document.getElementById("chartContainer");
  const table = document.getElementById("tableContainer");
  const noData = document.getElementById("glucoseNoDataMessage");

  if (!chart || !table || !noData) return;

  const hasData = Array.isArray(records) && records.length > 0;

  if (!hasData) {
    chart.style.display = "none";
    table.style.display = "none";
    noData.style.display = "block";
    return;
  }

  noData.style.display = "none";
  chart.style.display = view === "chart" ? "block" : "none";
  table.style.display = view === "table" ? "block" : "none";
}

export function showNoGlucoseDataMessage(show) {
  const noData = document.getElementById("glucoseNoDataMessage");
  const chart = document.getElementById("chartContainer");
  const table = document.getElementById("tableContainer");

  if (!noData || !chart || !table) return;

  if (show) {
    noData.style.display = "block";
    chart.style.display = "none";
    table.style.display = "none";
  } else {
    noData.style.display = "none";
  }
}


// ---- blood pressure chart ----

export function renderBPChart(records) {
  const canvas = document.getElementById("bpChart");
  if (!canvas) return;

  if (bpChartInstance) {
    bpChartInstance.destroy();
    bpChartInstance = null;
  }

  if (!records || records.length === 0) return;

  const sorted = sortAsc(records, "recordTime");

  bpChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: sorted.map(r => fmtLabel(r.recordTime)),
      datasets: [
        {
          label: "Systolic",
          data: sorted.map(r => r.systolic),
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231,76,60,0.08)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#e74c3c"
        },
        {
          label: "Diastolic",
          data: sorted.map(r => r.diastolic),
          borderColor: "#1f7fbf",
          backgroundColor: "rgba(31,127,191,0.08)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#1f7fbf"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} mmHg`
          }
        }
      },
      scales: { y: { beginAtZero: false } }
    }
  });
}

export function renderBPTable(records) {
  const body = document.getElementById("bpTableBody");
  if (!body) return;

  body.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    body.innerHTML = `<tr><td colspan="3" style="padding:12px; text-align:center;">No data found.</td></tr>`;
    return;
  }

  sortDesc(records, "recordTime").forEach(r => {
    const { date, time } = fmtDateTime(r.recordTime);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid #eee;">
        <div style="font-weight:600;">${date}</div>
        <div style="font-size:0.9em; color:#666;">${time}</div>
      </td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.systolic}</td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.diastolic}</td>`;
    body.appendChild(row);
  });
}

export function setBPView(view, records) {
  const chart = document.getElementById("bpChartContainer");
  const table = document.getElementById("bpTableContainer");
  const noData = document.getElementById("bpNoDataMessage");

  if (!chart || !table || !noData) return;

  const hasData = Array.isArray(records) && records.length > 0;

  if (!hasData) {
    chart.style.display = "none";
    table.style.display = "none";
    noData.style.display = "block";
    return;
  }

  noData.style.display = "none";
  chart.style.display = view === "chart" ? "block" : "none";
  table.style.display = view === "table" ? "block" : "none";
}


// ---- heart rate charts ----

export function renderHRChart(records) {
  const canvas = document.getElementById("hrChart");
  if (!canvas) return;

  if (hrChartInstance) {
    hrChartInstance.destroy();
    hrChartInstance = null;
  }

  if (!records || records.length === 0) return;

  const sorted = sortAsc(records, "recordTime");

  hrChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: sorted.map(r => fmtLabel(r.recordTime)),
      datasets: [{
        data: sorted.map(r => r.heartRate),
        borderColor: "#e74c3c",
        backgroundColor: "rgba(231,76,60,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#e74c3c"
      }]
    },
    options: chartOptions("bpm")
  });
}

export function renderHRTable(records) {
  const body = document.getElementById("hrTableBody");
  if (!body) return;

  body.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    body.innerHTML = `<tr><td colspan="2" style="padding:12px; text-align:center;">No data found.</td></tr>`;
    return;
  }

  sortDesc(records, "recordTime").forEach(r => {
    const { date, time } = fmtDateTime(r.recordTime);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid #eee;">
        <div style="font-weight:600;">${date}</div>
        <div style="font-size:0.9em; color:#666;">${time}</div>
      </td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.heartRate} bpm</td>`;
    body.appendChild(row);
  });
}

export function setHRView(view, records) {
  const chart = document.getElementById("hrChartContainer");
  const table = document.getElementById("hrTableContainer");
  const noData = document.getElementById("hrNoDataMessage");

  if (!chart || !table || !noData) return;

  const hasData = Array.isArray(records) && records.length > 0;

  if (!hasData) {
    chart.style.display = "none";
    table.style.display = "none";
    noData.style.display = "block";
    return;
  }

  noData.style.display = "none";
  chart.style.display = view === "chart" ? "block" : "none";
  table.style.display = view === "table" ? "block" : "none";
}


// ---- tasks updated ----

export function renderTasks(mandatoryTasks, optionalTasks, onToggle, onDelete) {
  renderTaskList("mandatoryTasksList", mandatoryTasks, false, onToggle, null);
  renderTaskList("optionalTasksList", optionalTasks, true, onToggle, onDelete);
}

function renderTaskList(listId, tasks, isDeletable, onToggle, onDelete) {
  const list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "goal-item";
    empty.style.cssText = "color:var(--text-secondary); font-style:italic;";
    empty.textContent = isDeletable ? "No personal tasks added yet." : "No tasks assigned by your doctor yet.";
    list.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "goal-item" + (task.completed ? " completed" : "");

    li.innerHTML = `
      <div class="goal-left">
        <input type="checkbox" ${task.completed ? "checked" : ""} />
        <span>${task.description}</span>
      </div>
      ${isDeletable ? `<button class="delete-btn" title="Delete task">x</button>` : ""}
    `;

    li.querySelector("input").addEventListener("change", () => {
      if (onToggle) onToggle(task.id, isDeletable);
    });

    if (isDeletable) {
      li.querySelector(".delete-btn").addEventListener("click", () => {
        if (onDelete) onDelete(task.id);
      });
    }

    list.appendChild(li);
  });
}


// ---- goals ----

export function renderGoals(goals, onToggle, onDelete) {
  const list = document.getElementById("goalsList");
  if (!list) return;

  list.innerHTML = "";

  if (!goals || goals.length === 0) {
    list.innerHTML = `<li class="goal-item">No goals added yet.</li>`;
    return;
  }

  goals.forEach(goal => {
    const li = document.createElement("li");
    li.className = "goal-item" + (goal.completed ? " completed" : "");
    li.innerHTML = `
      <div class="goal-left">
        <input type="checkbox" ${goal.completed ? "checked" : ""} />
        <span>${goal.text}</span>
      </div>
      <button class="delete-btn">x</button>
    `;
    li.querySelector("input").addEventListener("change", () => onToggle(goal.id));
    li.querySelector(".delete-btn").addEventListener("click", () => onDelete(goal.id));
    list.appendChild(li);
  });
}

export function initGoalForm(onAddGoal) {
  const button = document.getElementById("addGoalBtn");
  if (!button) return;

  button.addEventListener("click", () => {
    const text = prompt("Enter your new goal:");
    if (!text || text.trim() === "") return;
    onAddGoal(text.trim());
  });
}


// ---- helper functions ----

function sortAsc(records, field) {
  return [...records].sort((a, b) => new Date(a[field]) - new Date(b[field]));
}

function sortDesc(records, field) {
  return [...records].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

function fmtLabel(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtDateTime(dateString) {
  const d = new Date(dateString);
  return {
    date: d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
}

function chartOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y} ${unit}`
        }
      }
    },
    scales: { y: { beginAtZero: false } }
  };
}