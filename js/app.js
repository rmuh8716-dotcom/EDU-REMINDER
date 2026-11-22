
/* =========================================
   EDU REMINDER - PROFESSIONAL APPLICATION
   ========================================= */

// ELEMENTS
const $ = (id) => document.getElementById(id);

const taskForm = $("taskForm");
const taskInput = $("taskInput");
const taskList = $("taskList");
const taskPriority = $("taskPriority");
const taskDueDate = $("taskDueDate");
const taskFilter = $("taskFilter");

const scheduleForm = $("scheduleForm");
const scheduleName = $("scheduleName");
const scheduleDate = $("scheduleDate");
const scheduleStart = $("scheduleStart");
const scheduleEnd = $("scheduleEnd");
const scheduleDescription = $("scheduleDescription");
const scheduleList = $("scheduleList");

const totalTugas = $("totalTugas");
const tugasSelesai = $("tugasSelesai");
const totalJadwal = $("totalJadwal");

let tasks = loadData("edu_reminder_tasks", "campusmate_tasks");
let schedules = loadData("edu_reminder_schedules");
let notifications = loadData("edu_reminder_notifications");
let calendarDate = new Date();
let selectedDate = formatDate(new Date());

// STORAGE
function loadData(key, legacyKey) {
    try {
        const raw = localStorage.getItem(key) ||
            (legacyKey ? localStorage.getItem(legacyKey) : null);

        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Gagal membaca data:", error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Gagal menyimpan data:", error);
        showToast("Penyimpanan gagal. Periksa ruang penyimpanan browser.");
    }
}

function saveTasks() {
    saveData("edu_reminder_tasks", tasks);
}

function saveSchedules() {
    saveData("edu_reminder_schedules", schedules);
}

// HELPERS
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatReadableDate(value) {
    const date = parseDate(value);
    if (!date) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}



function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    clearTimeout(showToast.timer);
    clearTimeout(showToast.hideTimer);

    toast.textContent = message;
    toast.classList.remove("hide");
    toast.classList.add("show");

    showToast.timer = setTimeout(() => {
        toast.classList.add("hide");

        showToast.hideTimer = setTimeout(() => {
            toast.classList.remove("show", "hide");
        }, 150);

    }, 800);
}



function createButton(label, action, className = "action-button") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className;
    button.addEventListener("click", action);
    return button;
}

function emptyState(message) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = message;
    return li;
}

// DASHBOARD STATISTICS
function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    if (totalTugas) totalTugas.textContent = tasks.length;
    if (tugasSelesai) tugasSelesai.textContent = completed;
    if (totalJadwal) totalJadwal.textContent = schedules.length;

    if ($("progressPercent")) {
        $("progressPercent").textContent = percentage + "%";
    }

    if ($("progressFill")) {
        $("progressFill").style.width = percentage + "%";
    }
}


// TASK MANAGEMENT
function renderTasks() {
    if (!taskList) return;

    taskList.innerHTML = "";

    const filter = taskFilter ? taskFilter.value : "all";

    let visibleTasks = [...tasks];

    if (filter === "active") {
        visibleTasks = visibleTasks.filter(task => !task.completed);
    } else if (filter === "completed") {
        visibleTasks = visibleTasks.filter(task => task.completed);
    }

    if (!visibleTasks.length) {
        taskList.appendChild(emptyState(
            filter === "completed"
                ? "Belum ada tugas yang selesai."
                : filter === "active"
                    ? "Semua tugas sudah diselesaikan."
                    : "Belum ada tugas. Tambahkan tugas pertamamu!"
        ));
        updateStats();
        return;
    }

    visibleTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = task.completed ? "task-item task-completed" : "task-item";

        const check = createButton(
            task.completed ? "✓ Selesai" : "○ Tandai Selesai",
            () => {
                task.completed = !task.completed;
                saveTasks();
                renderAll();

                showToast(
                    task.completed
                        ? "Tugas berhasil diselesaikan!"
                        : "Tugas dikembalikan ke daftar aktif."
                );
            },
            task.completed
                ? "action-button complete-action is-completed"
                : "action-button complete-action"
        );

        const content = document.createElement("div");
        content.className = "task-content";

        const name = document.createElement("div");
        name.className = "task-name" + (task.completed ? " completed" : "");
        name.textContent = task.name;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        const priorityValue = task.priority || "Normal";
        priority.className = "priority " + priorityValue.toLowerCase();
        priority.textContent = "Prioritas " + priorityValue;

        meta.appendChild(priority);

        if (task.dueDate) {
            const due = document.createElement("span");
            due.textContent = "Tenggat: " + formatReadableDate(task.dueDate);
            meta.appendChild(due);
        }

        if (task.dueTime) {
            const time = document.createElement("span");
            time.textContent = "Jam: " + task.dueTime;
            meta.appendChild(time);
        }

        content.append(name, meta);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const edit = createButton("Edit", () => {
            const newName = prompt("Ubah nama tugas:", task.name);

            if (newName && newName.trim()) {
                task.name = newName.trim();
                saveTasks();
                renderAll();
                showToast("Tugas berhasil diperbarui.");
            }
        });

        const remove = createButton("Hapus", () => {
            if (confirm("Apakah kamu yakin ingin menghapus tugas ini?")) {
                tasks = tasks.filter(item => item.id !== task.id);
                saveTasks();
                renderAll();
                showToast("Tugas berhasil dihapus.");
            }
        }, "action-button delete-action");

        actions.append(edit, remove);
        li.append(check, content, actions);
        taskList.appendChild(li);
    });

    updateStats();
}

if (taskForm) {
    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = taskInput.value.trim();
        if (!name) return;

        const dueTimeInput = $("taskDueTime");

        tasks.unshift({
            id: Date.now(),
            name,
            completed: false,
            priority: taskPriority ? taskPriority.value : "Normal",
            dueDate: taskDueDate ? taskDueDate.value : "",
            dueTime: dueTimeInput ? dueTimeInput.value : ""
        });

        saveTasks();
        taskForm.reset();
        renderAll();

        showToast("Tugas berhasil ditambahkan!");
    });
}

if (taskFilter) {
    taskFilter.addEventListener("change", renderTasks);
}

// SCHEDULE MANAGEMENT
function sortSchedules() {
    return [...schedules].sort((a, b) => {
        return (a.date + a.start).localeCompare(b.date + b.start);
    });
}

function renderSchedules() {
    if (!scheduleList) return;

    scheduleList.innerHTML = "";

    const sorted = sortSchedules();

    if (!sorted.length) {
        scheduleList.appendChild(emptyState(
            "Belum ada jadwal. Tambahkan kegiatan pertamamu!"
        ));
    }

    sorted.forEach(schedule => {
        const li = document.createElement("li");

        const time = document.createElement("div");
        time.className = "schedule-time";
        time.textContent = `${schedule.start} – ${schedule.end}`;

        const info = document.createElement("div");
        info.className = "schedule-info";

        const title = document.createElement("strong");
        title.textContent = schedule.name;

        const description = document.createElement("p");
        description.textContent = schedule.description || "Tidak ada keterangan.";

        info.append(title, description);

        const date = document.createElement("div");
        date.className = "schedule-date-label";
        date.textContent = formatReadableDate(schedule.date);

        const actions = document.createElement("div");
        actions.className = "schedule-actions";

        const edit = createButton("Edit", () => {
            const newName = prompt("Ubah nama kegiatan:", schedule.name);

            if (newName && newName.trim()) {
                schedule.name = newName.trim();
                saveSchedules();
                renderAll();
                showToast("Jadwal berhasil diperbarui.");
            }
        });

        const remove = createButton("Hapus", () => {
            if (confirm("Hapus jadwal ini?")) {
                schedules = schedules.filter(item => item.id !== schedule.id);
                saveSchedules();
                renderAll();
                showToast("Jadwal berhasil dihapus.");
            }
        }, "action-button delete-action");

        actions.append(edit, remove);
        li.append(time, info, date, actions);
        scheduleList.appendChild(li);
    });

    updateStats();
}

if (scheduleForm) {
    scheduleForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = scheduleName.value.trim();
        const date = scheduleDate.value;
        const start = scheduleStart.value;
        const end = scheduleEnd.value;
        const description = scheduleDescription.value.trim();

        if (!name || !date || !start || !end) {
            showToast("Lengkapi informasi jadwal terlebih dahulu.");
            return;
        }

        if (end <= start) {
            showToast("Waktu selesai harus setelah waktu mulai.");
            return;
        }

        schedules.push({
            id: Date.now(),
            name,
            date,
            start,
            end,
            description
        });

        saveSchedules();
        scheduleForm.reset();
        renderAll();
        showToast("Jadwal berhasil ditambahkan.");
    });
}

// DASHBOARD RECENT TASKS
function renderRecentTasks() {
    const list = $("recentTaskList");
    if (!list) return;

    list.innerHTML = "";

    const recent = tasks.slice(0, 5);

    if (!recent.length) {
        list.appendChild(emptyState("Belum ada aktivitas tugas."));
        return;
    }

    recent.forEach(task => {
        const li = document.createElement("li");

        const check = document.createElement("span");
        check.className = "recent-check" + (task.completed ? " done" : "");

        const name = document.createElement("span");
        name.className = "recent-task-name" + (task.completed ? " done" : "");
        name.textContent = task.name;

        const status = document.createElement("span");
        status.className = "task-date";
        status.textContent = task.completed ? "Selesai" : "Berjalan";

        li.append(check, name, status);
        list.appendChild(li);
    });
}

// UPCOMING SCHEDULES
function renderUpcomingSchedules() {
    const list = $("upcomingScheduleList");
    if (!list) return;

    list.innerHTML = "";

    const today = formatDate(new Date());

    const upcoming = sortSchedules()
        .filter(item => item.date >= today)
        .slice(0, 5);

    if (!upcoming.length) {
        list.appendChild(emptyState("Belum ada agenda mendatang."));
        return;
    }

    upcoming.forEach(schedule => {
        const li = document.createElement("li");

        const dateObject = parseDate(schedule.date);

        const date = document.createElement("div");
        date.className = "agenda-date";

        const day = document.createElement("strong");
        day.textContent = dateObject.getDate();

        const month = document.createElement("small");
        month.textContent = dateObject.toLocaleDateString("id-ID", {
            month: "short"
        });

        date.append(day, month);

        const info = document.createElement("div");
        info.className = "agenda-info";

        const title = document.createElement("strong");
        title.textContent = schedule.name;

        const time = document.createElement("small");
        time.textContent = `${schedule.start} – ${schedule.end}`;

        info.append(title, time);
        li.append(date, info);
        list.appendChild(li);
    });
}

// CALENDAR
function renderCalendar() {
    const grid = $("calendarGrid");
    const title = $("calendarMonthTitle");

    if (!grid || !title) return;

    grid.innerHTML = "";

    title.textContent = calendarDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
    });

    const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    weekdays.forEach(day => {
        const cell = document.createElement("div");
        cell.className = "calendar-cell weekday";
        cell.textContent = day;
        grid.appendChild(cell);
    });

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const today = formatDate(new Date());

    for (let index = 0; index < 42; index++) {
        let dayNumber;
        let cellDate;
        let muted = false;

        if (index < firstDay) {
            dayNumber = previousMonthDays - firstDay + index + 1;
            cellDate = formatDate(new Date(year, month - 1, dayNumber));
            muted = true;
        } else if (index >= firstDay + daysInMonth) {
            dayNumber = index - firstDay - daysInMonth + 1;
            cellDate = formatDate(new Date(year, month + 1, dayNumber));
            muted = true;
        } else {
            dayNumber = index - firstDay + 1;
            cellDate = formatDate(new Date(year, month, dayNumber));
        }

        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-cell";

        if (muted) cell.classList.add("muted-day");
        if (cellDate === today) cell.classList.add("today");
        if (cellDate === selectedDate) cell.classList.add("selected");

        const number = document.createElement("span");
        number.className = "day-number";
        number.textContent = dayNumber;

        cell.appendChild(number);

        const count = schedules.filter(item => item.date === cellDate).length;

        if (count > 0) {
            const dots = document.createElement("span");
            dots.className = "calendar-dots";

            for (let i = 0; i < Math.min(count, 3); i++) {
                const dot = document.createElement("span");
                dot.className = "calendar-dot";
                dots.appendChild(dot);
            }

            if (count > 3) {
                const more = document.createElement("span");
                more.className = "calendar-dot more";
                dots.appendChild(more);
            }

            cell.appendChild(dots);
        }

        cell.addEventListener("click", () => {
            selectedDate = cellDate;

            if (muted) {
                calendarDate = new Date(
                    Number(cellDate.slice(0, 4)),
                    Number(cellDate.slice(5, 7)) - 1,
                    1
                );
            }

            renderCalendar();
            renderSelectedDate();
        });

        grid.appendChild(cell);
    }

    renderSelectedDate();
}

function renderSelectedDate() {
    const list = $("selectedDateList");
    const title = $("selectedDateTitle");

    if (!list || !title) return;

    title.textContent = "Agenda — " + formatReadableDate(selectedDate);
    list.innerHTML = "";

    const selectedSchedules = sortSchedules()
        .filter(item => item.date === selectedDate);

    if (!selectedSchedules.length) {
        list.appendChild(emptyState("Tidak ada agenda pada tanggal ini."));
        return;
    }

    selectedSchedules.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.start}–${item.end} · ${item.name}` +
            (item.description ? " — " + item.description : "");
        list.appendChild(li);
    });
}

$("prevMonth")?.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

$("nextMonth")?.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

$("todayMonth")?.addEventListener("click", () => {
    calendarDate = new Date();
    selectedDate = formatDate(new Date());
    renderCalendar();
});

// NAVIGATION
function updateActiveNavigation() {
    const current = location.hash || "#dashboard";

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === current
        );
    });

   const sectionNames = {
    "#dashboard": "Dashboard",
    "#tugas": "Tugas Saya",
    "#kalender": "Kalender",
    "#jadwal": "Jadwal",
    "#notifikasi": "Notifikasi"
};

    const breadcrumb = document.querySelector(".breadcrumb strong");
    if (breadcrumb) {
        breadcrumb.textContent = sectionNames[current] || "Dashboard";
    }
}

window.addEventListener("hashchange", () => {
    updateActiveNavigation();
    closeSidebar();
});

function closeSidebar() {
    $("sidebar")?.classList.remove("open");
    $("sidebarOverlay")?.classList.remove("show");
}

$("menuToggle")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
    $("sidebarOverlay")?.classList.toggle("show");
});

$("sidebarOverlay")?.addEventListener("click", closeSidebar);

// HEADER DATE
function updateHeaderDate() {
    const headerDate = $("headerDate");
    if (!headerDate) return;

    headerDate.textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// REFRESH ALL COMPONENTS
function renderAll() {
    renderTasks();
    renderSchedules();
    renderRecentTasks();
    renderUpcomingSchedules();
    updateStats();
    renderCalendar();
}

// INITIALIZE
updateHeaderDate();
renderAll();
renderNotifications();
updateActiveNavigation();

console.log("EDU REMINDER Professional Dashboard berhasil dijalankan!");
/* ==========================================
   EDU REMINDER - SMART NOTIFICATION
========================================== */

const enableNotificationsBtn = document.getElementById(
    "enableNotificationsBtn"
);

const notificationButtonText = document.getElementById(
    "notificationButtonText"
);

// Memperbarui tampilan tombol
function updateNotificationButton() {
    if (!enableNotificationsBtn || !notificationButtonText) return;

    if (!("Notification" in window)) {
        notificationButtonText.textContent = "Tidak Didukung";
        enableNotificationsBtn.disabled = true;
        return;
    }

    if (Notification.permission === "granted") {
        notificationButtonText.textContent = "Notifikasi Aktif";
    } else if (Notification.permission === "denied") {
        notificationButtonText.textContent = "Izin Ditolak";
    } else {
        notificationButtonText.textContent = "Aktifkan Notifikasi";
    }
}

// Meminta izin notifikasi dari pengguna
if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            showToast("Browser tidak mendukung notifikasi.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();

            updateNotificationButton();

            if (permission === "granted") {
                showToast("Notifikasi EDU REMINDER berhasil diaktifkan!");

                new Notification("EDU REMINDER", {
                    body: "Smart Reminder siap membantu mengingatkan jadwalmu.",
                    icon: "assets/logo.png"
                });
            } else {
                showToast("Izin notifikasi belum diberikan.");
            }
        } catch (error) {
            console.error("Notification error:", error);
            showToast("Gagal mengaktifkan notifikasi.");
        }
    });
}

// Periksa status izin saat aplikasi dibuka
updateNotificationButton();
/* ==========================================
   EDU REMINDER - SMART REMINDER ENGINE
========================================== */

// PENGATURAN SMART REMINDER
const SMART_REMINDER_CONFIG = {
    active: true,
    scheduleBeforeMinutes: 60,
    dailyBriefingTime: "07:00",
    channels: "both"
};

// Mengirim notifikasi melalui dua saluran
// SIMPAN RIWAYAT NOTIFIKASI
function saveNotifications() {
    saveData("edu_reminder_notifications", notifications);
}

// TAMPILKAN NOTIFICATION CENTER
function renderNotifications() {
    const list = $("notificationList");
    const count = $("notificationCount");
    const badge = $("notificationBadge");

    const unread = notifications.filter(item => !item.read).length;

    if (count) {
        count.textContent = `${notifications.length} pemberitahuan`;
    }

    if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? "inline-flex" : "none";
    }

    if (!list) return;

    list.innerHTML = "";

    if (notifications.length === 0) {
        list.appendChild(emptyState("Belum ada pemberitahuan."));
        return;
    }

    notifications.forEach(item => {
        const li = document.createElement("li");
        li.className = "notification-item" + (item.read ? "" : " unread");
        li.dataset.id = item.id;

        const title = document.createElement("strong");
        title.textContent = item.title;

        const message = document.createElement("p");
        message.textContent = item.message;

        const time = document.createElement("small");
        time.textContent = item.time;

        li.append(title, message, time);
        list.appendChild(li);
    });
}

// KIRIM DAN SIMPAN NOTIFIKASI
function sendSmartNotification(title, message) {
    if (!SMART_REMINDER_CONFIG.active) return;

    notifications.unshift({
        id: Date.now(),
        title,
        message,
        time: new Date().toLocaleString("id-ID"),
        read: false
    });

    notifications = notifications.slice(0, 100);
    saveNotifications();
    renderNotifications();
    showToast(`${title}: ${message}`);

    if (
        SMART_REMINDER_CONFIG.channels === "both" &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
    ) {
        new Notification(title, { body: message });
    }
}
    
// TANDAI NOTIFIKASI SEBAGAI DIBACA
$("notificationList")?.addEventListener("click", event => {
    const item = event.target.closest(".notification-item");
    if (!item) return;

    const id = Number(item.dataset.id);

    notifications = notifications.map(notification => ({
        ...notification,
        read: notification.id === id
            ? true
            : notification.read
    }));

    saveNotifications();
    renderNotifications();
});

// HAPUS SEMUA NOTIFIKASI
$("clearNotificationsBtn")?.addEventListener("click", () => {
    if (notifications.length === 0) {
        showToast("Belum ada notifikasi untuk dihapus.");
        return;
    }

    if (!confirm("Yakin ingin menghapus semua notifikasi?")) {
        return;
    }

    notifications = [];

    saveNotifications();
    renderNotifications();

    showToast("Semua notifikasi berhasil dihapus.");
});

// Mendapatkan tanggal lokal
function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ==========================================
// SMART REMINDER ENGINE - INTEGRATED
// ==========================================

// 1. PENGINGAT JADWAL
function checkScheduleReminders() {
    if (!SMART_REMINDER_CONFIG.active) return;
    if (!Array.isArray(schedules)) return;

    const now = new Date();

    schedules.forEach(schedule => {
        if (!schedule.date || !schedule.start || !schedule.id) return;

        const scheduleTime = new Date(
            `${schedule.date}T${schedule.start}:00`
        );

        const minutesRemaining =
            (scheduleTime.getTime() - now.getTime()) / 60000;

        const reminderKey =
            `edu_reminder_schedule_${schedule.id}_${schedule.date}`;

        if (
            minutesRemaining > 0 &&
            minutesRemaining <= SMART_REMINDER_CONFIG.scheduleBeforeMinutes &&
            !localStorage.getItem(reminderKey)
        ) {
            sendSmartNotification(
                "Pengingat Jadwal",
                `${schedule.name} akan dimulai dalam sekitar ${Math.ceil(minutesRemaining)} menit.`
            );

            localStorage.setItem(reminderKey, "sent");
        }
    });
}

// 2. PENGINGAT TENGGAT TUGAS
function checkTaskDeadlineReminders() {
    if (!SMART_REMINDER_CONFIG.active) return;
    if (!Array.isArray(tasks)) return;

    const now = new Date();

    tasks.forEach(task => {
        if (
            task.completed ||
            !task.id ||
            !task.dueDate ||
            !task.dueTime
        ) return;

        const deadline = new Date(
            `${task.dueDate}T${task.dueTime}:00`
        );

        const minutesRemaining =
            (deadline.getTime() - now.getTime()) / 60000;

        const reminderKey =
            `edu_reminder_task_${task.id}_${task.dueDate}_${task.dueTime}`;

        if (
            minutesRemaining > 0 &&
            minutesRemaining <= 60 &&
            !localStorage.getItem(reminderKey)
        ) {
            sendSmartNotification(
                "Pengingat Tenggat Tugas",
                `Tugas "${task.name}" harus dikumpulkan dalam sekitar ${Math.ceil(minutesRemaining)} menit.`
            );

            localStorage.setItem(reminderKey, "sent");
        }
    });
}

// 3. BRIEFING HARIAN PUKUL 07.00
function checkDailyBriefing() {
    if (!SMART_REMINDER_CONFIG.active) return;

    const now = new Date();
    const today = getLocalDateKey(now);

    const [briefingHour, briefingMinute] =
        SMART_REMINDER_CONFIG.dailyBriefingTime
            .split(":")
            .map(Number);

    const briefingTime = new Date(now);
    briefingTime.setHours(briefingHour, briefingMinute, 0, 0);

    const briefingKey =
        `edu_reminder_briefing_${today}`;

    if (
        now < briefingTime ||
        localStorage.getItem(briefingKey)
    ) return;

    const todayTasks = Array.isArray(tasks)
        ? tasks.filter(task =>
            task.dueDate === today && !task.completed
        )
        : [];

    const todaySchedules = Array.isArray(schedules)
        ? schedules.filter(schedule =>
            schedule.date === today
        )
        : [];

    const message =
        `Hari ini ada ${todayTasks.length} tugas yang perlu diselesaikan dan ${todaySchedules.length} jadwal kegiatan. Semangat menjalani harimu!`;

    sendSmartNotification(
        "Briefing Pagi EDU REMINDER",
        message
    );

    localStorage.setItem(briefingKey, "sent");
}

// 4. MENJALANKAN MESIN PENGINGAT
let smartReminderInterval = null;

function startSmartReminderEngine() {
    if (!SMART_REMINDER_CONFIG.active) return;

    // Hindari interval ganda
    if (smartReminderInterval) {
        clearInterval(smartReminderInterval);
    }

    function runReminderChecks() {
        checkScheduleReminders();
        checkTaskDeadlineReminders();
        checkDailyBriefing();
    }

    runReminderChecks();

    smartReminderInterval = setInterval(
        runReminderChecks,
        30000
    );
}

// AKTIFKAN SMART REMINDER
startSmartReminderEngine();

console.log(
    "EDU REMINDER: Smart Reminder Integrated berhasil dijalankan."
);
console.log("EDU REMINDER Smart Reminder Engine aktif.");