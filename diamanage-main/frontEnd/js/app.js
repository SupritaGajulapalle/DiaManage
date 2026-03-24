import {
  renderWelcomeCard,
  renderGlucoseChart,
  renderGlucoseTable,
  renderBPChart,
  renderBPTable,
  renderHRChart,
  renderGoals,
  renderHRTable,
  renderTasks,
  setGlucoseView,
  setBPView,
  setHRView,
  showNoGlucoseDataMessage,
  initGoalForm
} from "./ui.js";
 
const API_BASE = "https://diamanage.onrender.com/api"; 

const userId   = sessionStorage.getItem("userId");
const userName = sessionStorage.getItem("userName");
const userRole = sessionStorage.getItem("userRole");
 
if (!userId || userRole !== "PATIENT") {
  alert("Please log in as a user.");
  window.location.href = "login.html";
}
 
// State
let currentGlucoseRecords = [];
let currentBPRecords      = [];
let currentHRRecords      = [];
let currentGoals          = [];
let mandatoryTasks        = [];
let optionalTasks         = [];
 
// ================================================================
//  INIT
// ================================================================
 
document.addEventListener("DOMContentLoaded", async () => {
  setupLogout();
  setupViewToggles();
  setupGlucoseForm();
  setupBPForm();
  setupHRForm();
  setupAlertModal();
  setupTaskForm();
 
  await loadDashboard();
 
  loadLocalGoals();
  initGoalForm(handleAddGoal);
  
});
 
// ================================================================
//  LOGOUT
// ================================================================
 
function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", e => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}
 
// ================================================================
//  VIEW TOGGLES
// ================================================================
 
function setupViewToggles() {
  document.getElementById("chartViewBtn")?.addEventListener("click",   () => setGlucoseView("chart", currentGlucoseRecords));
  document.getElementById("tableViewBtn")?.addEventListener("click",   () => setGlucoseView("table", currentGlucoseRecords));
  document.getElementById("bpChartViewBtn")?.addEventListener("click", () => setBPView("chart", currentBPRecords));
  document.getElementById("bpTableViewBtn")?.addEventListener("click", () => setBPView("table", currentBPRecords));
  document.getElementById("hrChartViewBtn")?.addEventListener("click", () => setHRView("chart", currentHRRecords));
  document.getElementById("hrTableViewBtn")?.addEventListener("click", () => setHRView("table", currentHRRecords));
}
 
// ================================================================
//  HEALTH ALERT MODAL
// ================================================================
 
function setupAlertModal() {
  document.getElementById("dismissAlertBtn")?.addEventListener("click", () => {
    const modal = document.getElementById("healthAlertModal");
    modal.classList.add("hidden");
    modal.style.display = "none";
  });
}
 
const ALERT_TIPS = {
  glucose_critically_low: {
    icon: "warning",
    title: "Your glucose is critically low",
    body: "A reading this low can be dangerous. Please act quickly.",
    tips: [
      "Eat 15-20g of fast-acting carbs: glucose tablets, fruit juice, or regular (not diet) fizzy drink",
      "Wait 15 minutes then recheck your glucose",
      "Once your reading recovers, have a small snack to keep it stable",
      "If you feel faint or symptoms do not improve, contact your doctor or call 999"
    ]
  },
  glucose_critically_high: {
    icon: "warning",
    title: "Your glucose is very high",
    body: "A persistently high reading can cause complications. Take action now.",
    tips: [
      "Drink plenty of water to help your kidneys flush out excess glucose",
      "Light exercise like a short walk can help bring levels down",
      "Check if you have taken your medication as prescribed",
      "If your reading stays high or you feel unwell, contact your GP or NHS 111"
    ]
  },
  bp_low: {
    icon: "info",
    title: "Your blood pressure is low",
    body: "Low BP can cause dizziness or fainting. Take it easy.",
    tips: [
      "Drink more fluids - dehydration is a common cause of low BP",
      "Stand up slowly from sitting or lying to avoid dizziness",
      "A small amount of salt in your diet can help raise BP - ask your doctor first",
      "If you feel faint, sit or lie down and contact your GP if it persists"
    ]
  },
  bp_high: {
    icon: "warning",
    title: "Your blood pressure is high",
    body: "High BP over time increases your risk of heart disease.",
    tips: [
      "Try a few minutes of slow deep breathing to help relax blood vessels",
      "Reduce salt and processed food intake where possible",
      "Regular moderate exercise helps lower BP over time",
      "If your reading is consistently high, speak to your GP about your medication"
    ]
  },
  hr_low: {
    icon: "info",
    title: "Your heart rate is low",
    body: "A very low resting heart rate can sometimes signal an issue.",
    tips: [
      "Light physical activity can raise your rate naturally",
      "Make sure you are not overtired or dehydrated",
      "If you feel short of breath, dizzy, or faint, contact your GP"

    ]
  },
  hr_high: {
    icon: "warning",
    title: "Your heart rate is elevated",
    body: "A high heart rate can be caused by stress, caffeine, or activity.",

    tips: [
      "Try slow breathing: breathe in for 4s, hold 4s, out for 6s",
      "Make sure you are well hydrated",
      "Reduce caffeine  and alcohol if you have had them recently",
      "If your heart rate stays high at rest or you feel chest pain contact your GP or call 999!"
    ]
  }
};
 
function showHealthAlert(alertKey) {
  const config = ALERT_TIPS[alertKey];
  if (!config) return;
 
  document.getElementById("alertIconRow").textContent = config.icon === "warning" ? "⚠️" : "ℹ️";
  document.getElementById("alertTitle").textContent   = config.title;
  document.getElementById("alertBody").textContent    = config.body;
  document.getElementById("alertTips").innerHTML      =
    config.tips.map(t => `<div style="margin-bottom:6px;">• ${t}</div>`).join("");
 
  const modal = document.getElementById("healthAlertModal");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}
 
function checkGlucoseAlert(value) {
  if (value < 3.5)  { showHealthAlert("glucose_critically_low");  return; }
  if (value > 11.0) { showHealthAlert("glucose_critically_high"); return; }
}
 


function checkBPAlert(systolic, diastolic) {
  if (systolic < 90 || diastolic < 60)  { showHealthAlert("bp_low");  return; }
  if (systolic > 140 || diastolic > 90) { showHealthAlert("bp_high"); return; }
}
 
function checkHRAlert(bpm) {
  if (bpm < 40)  { showHealthAlert("hr_low");  return; }
  if (bpm > 130) { showHealthAlert("hr_high"); return; }
}
 
// ================================================================
//  GLUCOSE FORM
// ================================================================
 
function setupGlucoseForm() {
  const toggleBtn     = document.getElementById("toggleGlucoseFormBtn");
  const formContainer = document.getElementById("addGlucoseFormContainer");
  const cancelBtn     = document.getElementById("cancelGlucoseBtn");
  const saveBtn       = document.getElementById("saveGlucoseBtn");
  const input         = document.getElementById("glucoseValueInput");
  const msg           = document.getElementById("glucoseFormMessage");
 
  if (!toggleBtn || !formContainer || !cancelBtn || !saveBtn || !input || !msg) return;
 
  toggleBtn.addEventListener("click", () => { formContainer.classList.toggle("hidden"); msg.textContent = ""; });
  cancelBtn.addEventListener("click", () => { formContainer.classList.add("hidden"); input.value = ""; msg.textContent = ""; });
 
  saveBtn.addEventListener("click", async () => {
    const value = parseFloat(input.value);
    if (!input.value || Number.isNaN(value) || value <= 0 || value > 30) {
      msg.textContent = "Please enter a valid glucose value (0-30 mmol/L).";
      msg.style.color = "red"; return;
    }
 
    saveBtn.disabled = true; msg.textContent = "Saving..."; msg.style.color = "#333";
 
    try {
      const res = await fetch(`${API_BASE}/glucose/add`, {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ userId: Number(userId), value })
      });
      if (!res.ok) throw new Error("Failed");
 
      const newRecord = await res.json();
      currentGlucoseRecords.push(newRecord);
      refreshWelcomeCard();
      renderGlucoseChart(currentGlucoseRecords);
      renderGlucoseTable(currentGlucoseRecords);
      showNoGlucoseDataMessage(false);
      setGlucoseView("chart", currentGlucoseRecords);
 
      input.value = ""; msg.textContent = "Glucose reading saved."; msg.style.color = "green";
      setTimeout(() => { formContainer.classList.add("hidden"); msg.textContent = ""; }, 800);
      setTimeout(() => checkGlucoseAlert(value), 900);
 
    } catch (err) {
      console.error("Error saving glucose:", err);
      msg.textContent = "Could not save glucose reading."; msg.style.color = "red";
    } finally { saveBtn.disabled = false; }
  });
}
 
// ================================================================
//  BLOOD PRESSURE FORM
// ================================================================
 
function setupBPForm() {
  const toggleBtn      = document.getElementById("toggleBPFormBtn");
  const formContainer  = document.getElementById("addBPFormContainer");
  const cancelBtn      = document.getElementById("cancelBPBtn");
  const saveBtn        = document.getElementById("saveBPBtn");
  const systolicInput  = document.getElementById("systolicInput");
  const diastolicInput = document.getElementById("diastolicInput");
  const msg            = document.getElementById("bpFormMessage");
 
  if (!toggleBtn || !formContainer || !cancelBtn || !saveBtn || !systolicInput || !diastolicInput || !msg) return; 
 
  toggleBtn.addEventListener("click", () => { formContainer.classList.toggle("hidden"); msg.textContent = ""; });
  cancelBtn.addEventListener("click", () => {
    formContainer.classList.add("hidden");
    systolicInput.value = ""; diastolicInput.value = ""; msg.textContent = "";
  });
 
  saveBtn.addEventListener("click", async () => {
    const systolic  = parseInt(systolicInput.value);
    const diastolic = parseInt(diastolicInput.value);
 
    if (!systolicInput.value || !diastolicInput.value ||
        Number.isNaN(systolic) || Number.isNaN(diastolic) ||
        systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
      msg.textContent = "Please enter valid systolic (50-250) and diastolic (30-150) values.";
      msg.style.color = "red"; return;
    }
 
    saveBtn.disabled = true; msg.textContent = "Saving..."; msg.style.color = "#333";
 
    try {
      const res = await fetch(`${API_BASE}/blood-pressure/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), systolic, diastolic })
      });
      if (!res.ok) throw new Error("Failed");
 
      const newRecord = await res.json();
      currentBPRecords.push(newRecord);
      refreshWelcomeCard();
      renderBPChart(currentBPRecords);
      renderBPTable(currentBPRecords);
      setBPView("chart", currentBPRecords);
 
      systolicInput.value = ""; diastolicInput.value = "";
      msg.textContent = "Blood pressure reading saved."; msg.style.color = "green";
      setTimeout(() => { formContainer.classList.add("hidden"); msg.textContent = ""; }, 800);
      setTimeout(() => checkBPAlert(systolic, diastolic), 900);
 
    } catch (err) {
      console.error("Error saving BP:", err);
      msg.textContent = "Could not save blood pressure reading."; msg.style.color = "red";
    } finally { saveBtn.disabled = false; }
  });
}
 
// ================================================================
//  HEART RATE FORM
// =========================================================
 
function setupHRForm() {
  const toggleBtn     = document.getElementById("toggleHRFormBtn");
  const formContainer = document.getElementById("addHRFormContainer");
  const cancelBtn     = document.getElementById("cancelHRBtn");
  const saveBtn       = document.getElementById("saveHRBtn");
  const input         = document.getElementById("heartRateInput");
  const msg           = document.getElementById("hrFormMessage");
 
  if (!toggleBtn || !formContainer || !cancelBtn || !saveBtn || !input || !msg) return;
 
  toggleBtn.addEventListener("click", () => { formContainer.classList.toggle("hidden"); msg.textContent = ""; });
  cancelBtn.addEventListener("click", () => { formContainer.classList.add("hidden"); input.value = ""; msg.textContent = ""; });
 
  saveBtn.addEventListener("click", async () => {
    const heartRate = parseInt(input.value);
    if (!input.value || Number.isNaN(heartRate) || heartRate < 30 || heartRate > 250) {
      msg.textContent = "Please enter a valid heart rate (30-250 bpm).";
      msg.style.color = "red"; return;
    }
 
    saveBtn.disabled = true; msg.textContent = "Saving..."; msg.style.color = "#333";
 
    try {
      const res = await fetch(`${API_BASE}/heartrate/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), heartRate })
      });
      if (!res.ok) throw new Error("Failed");
 
      const newRecord = await res.json();
      currentHRRecords.push(newRecord);
      refreshWelcomeCard();
      renderHRChart(currentHRRecords);
      renderHRTable(currentHRRecords);
      setHRView("chart", currentHRRecords);
 
      input.value = ""; msg.textContent = "Heart rate reading saved."; msg.style.color = "green";
      setTimeout(() => {formContainer.classList.add("hidden"); msg.textContent = ""; }, 800);
      setTimeout(() => checkHRAlert(heartRate), 900);
 
    } catch (err) {
      console.error("Error saving heart rate:", err);
      msg.textContent = "Could not save heart rate reading."; msg.style.color = "red";
    } finally { saveBtn.disabled = false; }
  });
}
 
// ================================================================
//  DASHBOARD LOAD
// ================================================================
 
async function loadDashboard() {
  try {
    const userRes = await fetch(`${API_BASE}/user/${userId}`);
    if (!userRes.ok) throw new Error("Failed to fetch user");
    const userData    = await userRes.json();
    const displayName = userData?.name || userName || "User";
 
    const [glucoseRes, bpRes, hrRes] = await Promise.all([
      fetch(`${API_BASE}/glucose/list/${userId}`),
      fetch(`${API_BASE}/blood-pressure/list/${userId}`),
      fetch(`${API_BASE}/heartrate/list/${userId}`)
    ]);
 
    currentGlucoseRecords = glucoseRes.ok ? (await glucoseRes.json() || []) : [];
    currentBPRecords      = bpRes.ok      ? (await bpRes.json()     || []) : [];
    currentHRRecords      = hrRes.ok      ? (await hrRes.json()     || []) : [];
 
    renderWelcomeCard(displayName, currentGlucoseRecords, currentBPRecords, currentHRRecords);
 
    if (currentGlucoseRecords.length === 0) { showNoGlucoseDataMessage(true); renderGlucoseTable([]); }
    else { showNoGlucoseDataMessage(false); renderGlucoseChart(currentGlucoseRecords); renderGlucoseTable(currentGlucoseRecords); }
    setGlucoseView("chart", currentGlucoseRecords);
 
    renderBPChart(currentBPRecords);
    renderBPTable(currentBPRecords);
    setBPView("chart", currentBPRecords);
 
    renderHRChart(currentHRRecords);
    renderHRTable(currentHRRecords);
    setHRView("chart", currentHRRecords);
 
    loadTasks();
 
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    renderWelcomeCard(userName || "User", [], [], []);
    currentGlucoseRecords = [];
    showNoGlucoseDataMessage(true);
    renderGlucoseTable([]);
    setGlucoseView("chart", []);
    setBPView("chart", []);
    setHRView("chart", []);
  }
}
 
function refreshWelcomeCard() {
  const displayName = sessionStorage.getItem("userName") || "User";
  renderWelcomeCard(displayName, currentGlucoseRecords, currentBPRecords, currentHRRecords);
}
 
// ================================================================
//  TASKS
//
//  Currently uses localStorage for optional tasks and shows
//  empty state for mandatory tasks (no backend yet).
//
//  When the task backend is ready, replace loadTasks() with:
//    GET /api/tasks/mandatory/{userId}  -> mandatoryTasks array
//    GET /api/tasks/optional/{userId}   -> optionalTasks array
//  And replace saveOptionalTasks() save calls with:
//    POST   /api/tasks/optional/add     { userId, text }
//    DELETE /api/tasks/optional/{taskId}
// ================================================================
 
// ================================================================
// TASKS
// ================================================================

async function loadTasks() {
  try {
    const res = await fetch(`${API_BASE}/task/user/${userId}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const tasks = await res.json();
    const allTasks = Array.isArray(tasks) ? tasks : [];

    mandatoryTasks = allTasks
      .filter(task => task.mandatory === true)
      .sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime));

    optionalTasks = allTasks
      .filter(task => task.mandatory === false)
      .sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime));

    renderTasks(mandatoryTasks, optionalTasks, handleToggleTask, handleDeleteTask);
  } catch (err) {
    console.error("Failed to load tasks:", err);
    mandatoryTasks = [];
    optionalTasks = [];
    renderTasks(mandatoryTasks, optionalTasks, handleToggleTask, handleDeleteTask);
  }
}

function setupTaskForm() {
  const addBtn = document.getElementById("addOptionalTaskBtn");
  const form = document.getElementById("addOptionalTaskForm");
  const input = document.getElementById("optionalTaskDescriptionInput");
  const saveBtn = document.getElementById("saveOptionalTaskBtn");
  const cancelBtn = document.getElementById("cancelOptionalTaskBtn");
  const message = document.getElementById("optionalTaskFormMessage");

  if (!addBtn || !form || !input || !saveBtn || !cancelBtn || !message) return;

  addBtn.addEventListener("click", () => {
    form.classList.toggle("hidden");
    message.textContent = "";

    if (!form.classList.contains("hidden")) {
      input.focus();
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.classList.add("hidden");
    input.value = "";
    message.textContent = "";
  });

  saveBtn.addEventListener("click", async () => {
    const description = input.value.trim();

    if (!description) {
      message.textContent = "Enter a task description.";
      return;
    }

    saveBtn.disabled = true;
    message.textContent = "Saving task...";

    try {
      const res = await fetch(`${API_BASE}/task/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: Number(userId),
          description: description,
          mandatory: false,
          createdByRole: "PATIENT"
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        message.textContent = data.message || "Could not save task.";
        return;
      }

      message.textContent = "Task saved successfully.";
      input.value = "";

      await loadTasks();

      setTimeout(() => {
        form.classList.add("hidden");
        message.textContent = "";
      }, 900);
    } catch (err) {
      console.error("Failed to save task:", err);
      message.textContent = "Could not save task.";
    } finally {
      saveBtn.disabled = false;
    }
  });
}

async function handleToggleTask(taskId, isOptional) {
  try {
    const res = await fetch(`${API_BASE}/task/toggle/${taskId}`, {
      method: "PATCH"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to toggle task");
    }

    const updatedTask = data.task;

    if (updatedTask.mandatory) {
      mandatoryTasks = mandatoryTasks.map(task =>
        task.id === taskId ? updatedTask : task
      );
    } else {
      optionalTasks = optionalTasks.map(task =>
        task.id === taskId ? updatedTask : task
      );
    }

    renderTasks(mandatoryTasks, optionalTasks, handleToggleTask, handleDeleteTask);
  } catch (err) {
    console.error("Failed to toggle task:", err);
    alert("Could not update task.");
  }
}

async function handleDeleteTask(taskId) {
  const task = optionalTasks.find(t => t.id === taskId);

  if (!task) {
    alert("Only optional tasks can be deleted.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/task/${taskId}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete task");
    }

    optionalTasks = optionalTasks.filter(task => task.id !== taskId);
    renderTasks(mandatoryTasks, optionalTasks, handleToggleTask, handleDeleteTask);
  } catch (err) {
    console.error("Failed to delete task:", err);
    alert("Could not delete task.");
  }
}

// ================================================================
//  GOALS 
// ================================================================
 
function loadLocalGoals() {
  const stored = localStorage.getItem(`diamanage_goals_${userId}`);
  currentGoals = stored ? JSON.parse(stored) : [];
  renderGoals(currentGoals, handleToggleGoal, handleDeleteGoal);
}
 
function saveLocalGoals() {
  localStorage.setItem(`diamanage_goals_${userId}`, JSON.stringify(currentGoals));
}
 
function handleAddGoal(text) {
  currentGoals.push({ id: Date.now(), text, completed: false });
  saveLocalGoals();
  renderGoals(currentGoals, handleToggleGoal, handleDeleteGoal);
}
 
function handleToggleGoal(id) {
  currentGoals = currentGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
  saveLocalGoals();
  renderGoals(currentGoals, handleToggleGoal, handleDeleteGoal);
}
 
function handleDeleteGoal(id) {
  currentGoals = currentGoals.filter(g => g.id !== id);
  saveLocalGoals();
  renderGoals(currentGoals, handleToggleGoal, handleDeleteGoal);
}
