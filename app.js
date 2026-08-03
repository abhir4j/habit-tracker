const defaultHabits = [
    { id: 1, name: "Deep Work (2 hrs)", icon: "🧠" },
    { id: 2, name: "Zone 2 Cardio", icon: "🫀" },
    { id: 3, name: "Read 20 Pages", icon: "📚" },
    { id: 4, name: "Plan Tomorrow", icon: "📝" },
    { id: 5, name: "No Sugar", icon: "🚫" },
    { id: 6, name: "Review Finances", icon: "📈" }
];

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
const realDate = new Date();

let activeWeekStart = getMonday(new Date());

let progressData = JSON.parse(localStorage.getItem('premiumTrackerData')) || {};
let habits = JSON.parse(localStorage.getItem('premiumTrackerList')) || defaultHabits;
let dailyTasksData = JSON.parse(localStorage.getItem('premiumTrackerDailyTasks')) || {};
let isEditing = false;
let currentTheme = localStorage.getItem('premiumTrackerTheme') || 'slate';

const els = {
    monthDisplay: document.getElementById('currentMonthDisplay'),
    subtitleDisplay: document.getElementById('currentDateSubtitle'),
    habitList: document.getElementById('habitListContainer'),
    dateHeader: document.getElementById('dateHeaderContainer'),
    grid: document.getElementById('checkboxGridContainer'),
    totalHabits: document.getElementById('totalHabitsCount'),
    totalCompleted: document.getElementById('totalCompletedCount'),
    progressText: document.getElementById('progressPercentText'),
    progressBar: document.getElementById('mainProgressBar'),
    dailyProgressRow: document.getElementById('dailyProgressRow'),
    dailyDoneRow: document.getElementById('dailyDoneRow'),
    dailyNotDoneRow: document.getElementById('dailyNotDoneRow'),
    editBtn: document.getElementById('editBtn'),
    streakVal: document.getElementById('currentStreakVal'),
    completionRate: document.getElementById('completionRateVal'),
    heatmapYear: document.getElementById('heatmapYear'),
    heatmapColumns: document.getElementById('heatmapColumns'),
    themeSelectD: document.getElementById('themeSelectDesktop'),
    themeSelectM: document.getElementById('themeSelectMobile'),
    heatmapTooltip: document.getElementById('heatmapTooltip'),
    weeklySpread: document.getElementById('weeklySpreadContainer'),
    snakeToggleBtn: document.getElementById('snakeToggleBtn'),
    snakePlayIcon: document.getElementById('snakePlayIcon'),
    snakeStopIcon: document.getElementById('snakeStopIcon'),
    snakeBtnText: document.getElementById('snakeBtnText')
};

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getDayName = (year, month, day) => new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
const generateKey = (year, month, day, habitId) => `${year}-${month}-${day}-${habitId}`;
const generateDateKey = (dateObj) => `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;

function init() {
    applyTheme(currentTheme, true);
    renderHeader();
    renderHabits();
    renderGrid();
    updateStats();
    initCharts();
    renderWeeklySpread();
    renderHeatmap();
}

window.changeTheme = function(themeName) {
    applyTheme(themeName, false);
};

function applyTheme(themeName, isInit) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('premiumTrackerTheme', themeName);
    els.themeSelectD.value = themeName;
    els.themeSelectM.value = themeName;

    if (!isInit) {
        requestAnimationFrame(() => {
            setTimeout(updateChartColors, 50);
        });
    }
}

window.changeMonth = function(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();

    renderHeader();
    renderHabits();
    renderGrid();
    updateStats();
    updateCharts();
    renderHeatmap();
};

function renderHeader() {
    const options = { month: 'long', year: 'numeric' };
    els.monthDisplay.textContent = currentDate.toLocaleDateString('en-US', options);

    const subtitleOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    els.subtitleDisplay.textContent = "Today: " + realDate.toLocaleDateString('en-US', subtitleOptions);

    els.totalHabits.textContent = habits.length;
    els.heatmapYear.textContent = currentYear;
}

window.toggleEditMode = function() {
    isEditing = !isEditing;
    if (!isEditing) {
        saveHabits();
        renderGrid();
        updateStats();
        updateCharts();
        renderWeeklySpread();
        renderHeatmap();
    }
    renderHabits();
};

window.updateHabitField = function(index, field, value) {
    habits[index][field] = value;
    saveHabits();
};

window.deleteHabit = function(index) {
    habits.splice(index, 1);
    saveHabits();
    renderHabits();
    renderGrid();
    updateStats();
    updateCharts();
    renderWeeklySpread();
    renderHeatmap();
};

window.addNewHabit = function() {
    const newId = Date.now();
    habits.push({ id: newId, name: "New Routine", icon: "✨" });
    saveHabits();
    renderHabits();
    renderGrid();
    updateStats();
    updateCharts();
    renderWeeklySpread();
    renderHeatmap();
};

function renderHabits() {
    if (isEditing) {
        els.habitList.innerHTML = habits.map((habit, index) => `
            <div class="h-12 flex items-center px-3 border-b border-border gap-2 bg-card">
                <input type="text" value="${habit.icon}" class="w-8 h-8 text-center border rounded-md text-sm" onchange="updateHabitField(${index}, 'icon', this.value)">
                <input type="text" value="${habit.name}" class="flex-1 h-8 px-2 border rounded-md text-sm font-medium" onchange="updateHabitField(${index}, 'name', this.value)">
                <button type="button" onclick="deleteHabit(${index})" class="text-textMuted hover:text-red-500 px-1 font-bold">✕</button>
            </div>
        `).join('') + `
            <div class="h-12 flex items-center justify-center bg-bg cursor-pointer hover:bg-border text-primary font-medium text-sm transition-colors" onclick="addNewHabit()">
                + Add Routine
            </div>
        `;
        els.editBtn.textContent = "Done";
        els.editBtn.classList.add("font-bold");
    } else {
        els.habitList.innerHTML = habits.map(habit => `
            <div class="h-12 flex items-center px-5 text-sm font-medium text-textMain border-b border-border bg-card truncate" title="${habit.name}">
                <span class="mr-3 text-lg">${habit.icon}</span>
                ${habit.name}
            </div>
        `).join('');
        els.editBtn.textContent = "Edit";
        els.editBtn.classList.remove("font-bold");
    }
}

function saveHabits() {
    localStorage.setItem('premiumTrackerList', JSON.stringify(habits));
    renderHeader();
}

function renderGrid() {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const isViewingCurrentRealMonth = currentYear === realDate.getFullYear() && currentMonth === realDate.getMonth();
    const todayDay = realDate.getDate();

    let headerHTML = '';
    for (let d = 1; d <= daysInMonth; d++) {
        const dayName = getDayName(currentYear, currentMonth, d);
        const isWeekend = new Date(currentYear, currentMonth, d).getDay() === 0 || new Date(currentYear, currentMonth, d).getDay() === 6;
        const isToday = isViewingCurrentRealMonth && d === todayDay;

        let bgClass = isWeekend ? 'bg-bg' : 'bg-card';
        let textClass = isWeekend ? 'text-textMuted opacity-70' : 'text-textMuted';
        let borderClass = 'border-r border-border';

        if (isToday) {
            bgClass = 'bg-primary';
            textClass = 'text-card';
            borderClass = 'border-x-2 border-primary z-10 rounded-t-md';
        }

        headerHTML += `
            <div class="flex-none w-12 ${borderClass} flex flex-col items-center justify-center pt-2 pb-1 ${bgClass} transition-colors">
                <span class="text-[10px] uppercase font-bold tracking-wider ${textClass} mb-1 opacity-80">${dayName}</span>
                <span class="text-sm font-bold ${textClass}">${d}</span>
            </div>
        `;
    }
    els.dateHeader.innerHTML = headerHTML;

    let gridHTML = '';
    habits.forEach(habit => {
        gridHTML += `<div class="flex h-12 border-b border-border">`;
        for (let d = 1; d <= daysInMonth; d++) {
            const key = generateKey(currentYear, currentMonth, d, habit.id);
            const isChecked = progressData[key] ? 'checked' : '';
            const isWeekend = new Date(currentYear, currentMonth, d).getDay() === 0 || new Date(currentYear, currentMonth, d).getDay() === 6;
            const isToday = isViewingCurrentRealMonth && d === todayDay;

            let bgClass = isWeekend ? 'bg-bg' : 'bg-card';
            let borderClass = 'border-r border-border';

            if (isToday) {
                bgClass = 'bg-bg';
                borderClass = 'border-x-2 border-primary opacity-50';
            }

            gridHTML += `
                <div class="flex-none w-12 ${borderClass} flex items-center justify-center ${bgClass} transition-colors">
                    <input type="checkbox"
                        class="custom-checkbox"
                        data-key="${key}"
                        ${isChecked}
                        onchange="toggleHabit(this)">
                </div>
            `;
        }
        gridHTML += `</div>`;
    });
    els.grid.innerHTML = gridHTML;
}

window.toggleHabit = function(checkbox) {
    const key = checkbox.dataset.key;
    if (checkbox.checked) {
        progressData[key] = true;
    } else {
        delete progressData[key];
    }
    saveData();
    updateStats();
    updateCharts();
    renderHabits();
    renderWeeklySpread();
    renderHeatmap();
};

function saveData() {
    localStorage.setItem('premiumTrackerData', JSON.stringify(progressData));
}

function calculateStreak() {
    let streak = 0;
    let checkDate = new Date(realDate.getFullYear(), realDate.getMonth(), realDate.getDate());

    while(true) {
        let dayCompletedSomething = false;
        const y = checkDate.getFullYear();
        const m = checkDate.getMonth();
        const d = checkDate.getDate();

        for (let i = 0; i < habits.length; i++) {
            const key = generateKey(y, m, d, habits[i].id);
            if (progressData[key]) {
                dayCompletedSomething = true;
                break;
            }
        }

        if (dayCompletedSomething) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (streak === 0 && checkDate.getTime() === new Date(realDate.getFullYear(), realDate.getMonth(), realDate.getDate()).getTime()) {
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
    return streak;
}

function updateStats() {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const totalPotential = habits.length * daysInMonth;

    let currentMonthCompleted = 0;
    let dailyCounts = new Array(daysInMonth + 1).fill(0);

    let totalRecordedCompleted = Object.keys(progressData).length;
    let compRate = totalRecordedCompleted === 0 ? 0 : Math.round((totalRecordedCompleted / (habits.length * 30)) * 100);

    els.streakVal.textContent = calculateStreak();
    els.completionRate.textContent = `${Math.min(compRate, 100)}%`;

    Object.keys(progressData).forEach(key => {
        const [y, m, d, hId] = key.split('-');
        if (parseInt(y) === currentYear && parseInt(m) === currentMonth && habits.some(h => h.id == hId)) {
            currentMonthCompleted++;
            dailyCounts[parseInt(d)]++;
        }
    });

    els.totalCompleted.textContent = currentMonthCompleted;
    const percentage = totalPotential === 0 ? 0 : Math.round((currentMonthCompleted / totalPotential) * 100);
    els.progressText.textContent = `${percentage}%`;
    els.progressBar.style.width = `${percentage}%`;

    let progressRowHTML = '';
    let doneRowHTML = '';
    let notDoneRowHTML = '';

    for (let d = 1; d <= daysInMonth; d++) {
        const doneCount = dailyCounts[d];
        const notDoneCount = habits.length - doneCount;
        const dailyPercent = habits.length === 0 ? 0 : Math.round((doneCount / habits.length) * 100);
        const isWeekend = new Date(currentYear, currentMonth, d).getDay() === 0 || new Date(currentYear, currentMonth, d).getDay() === 6;
        const bgClass = isWeekend ? 'bg-bg' : '';

        progressRowHTML += `
            <div class="flex-none w-12 border-r border-border flex items-center justify-center text-[10px] text-textMuted font-bold ${bgClass} transition-colors">
                ${dailyPercent}%
            </div>`;

        doneRowHTML += `
             <div class="flex-none w-12 border-r border-border flex items-center justify-center text-xs text-textMain font-bold ${bgClass} transition-colors">
                ${doneCount}
            </div>`;

        notDoneRowHTML += `
             <div class="flex-none w-12 border-r border-border flex items-center justify-center text-xs text-textMuted opacity-50 font-medium ${bgClass} transition-colors">
                ${notDoneCount}
            </div>`;
    }

    els.dailyProgressRow.innerHTML = progressRowHTML;
    els.dailyDoneRow.innerHTML = doneRowHTML;
    els.dailyNotDoneRow.innerHTML = notDoneRowHTML;
}

window.changeWeek = function(offset) {
    activeWeekStart.setDate(activeWeekStart.getDate() + (offset * 7));
    renderWeeklySpread();
};

window.resetToCurrentWeek = function() {
    activeWeekStart = getMonday(new Date());
    renderWeeklySpread();
};

window.addDailyTask = function(dateKey) {
    const inputEl = document.getElementById(`input-task-${dateKey}`);
    const val = inputEl.value.trim();
    if (!val) return;

    if (!dailyTasksData[dateKey]) dailyTasksData[dateKey] = [];
    dailyTasksData[dateKey].push({ id: Date.now(), text: val, done: false });
    localStorage.setItem('premiumTrackerDailyTasks', JSON.stringify(dailyTasksData));
    inputEl.value = '';
    renderWeeklySpread();
};

window.toggleDailyTask = function(dateKey, taskId) {
    if (!dailyTasksData[dateKey]) return;
    const task = dailyTasksData[dateKey].find(t => t.id === taskId);
    if (task) {
        task.done = !task.done;
        localStorage.setItem('premiumTrackerDailyTasks', JSON.stringify(dailyTasksData));
        renderWeeklySpread();
    }
};

window.deleteDailyTask = function(dateKey, taskId) {
    if (!dailyTasksData[dateKey]) return;
    dailyTasksData[dateKey] = dailyTasksData[dateKey].filter(t => t.id !== taskId);
    localStorage.setItem('premiumTrackerDailyTasks', JSON.stringify(dailyTasksData));
    renderWeeklySpread();
};

function renderWeeklySpread() {
    let cardsHTML = '';
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--primary').trim() || '#0f172a';
    const borderStrong = style.getPropertyValue('--border-strong').trim() || '#e2e8f0';

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(activeWeekStart);
        dayDate.setDate(dayDate.getDate() + i);

        const y = dayDate.getFullYear();
        const m = dayDate.getMonth();
        const d = dayDate.getDate();
        const dateKey = generateDateKey(dayDate);

        const dayNameLong = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateString = dayDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.');

        let completedRoutines = 0;
        habits.forEach(h => {
            if (progressData[generateKey(y, m, d, h.id)]) completedRoutines++;
        });
        const routinePct = habits.length === 0 ? 0 : Math.round((completedRoutines / habits.length) * 100);

        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (routinePct / 100) * circumference;

        const tasks = dailyTasksData[dateKey] || [];
        const completedTasks = tasks.filter(t => t.done).length;

        const isToday = dayDate.toDateString() === realDate.toDateString();
        const borderHighlight = isToday ? 'border-2 border-primary shadow-md' : 'border border-border';

        cardsHTML += `
            <div class="bg-card rounded-xl p-4 flex flex-col justify-between space-y-4 ${borderHighlight} transition-all min-w-0 overflow-hidden">
                <div class="flex items-center justify-between border-b border-border pb-2.5">
                    <div class="truncate pr-1">
                        <div class="text-xs font-bold uppercase tracking-wider text-textMain truncate">${dayNameLong}</div>
                        <div class="text-[11px] font-semibold text-textMuted">${dateString}</div>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-bg text-textMuted border border-border flex-none">
                        ${completedRoutines}/${habits.length}
                    </span>
                </div>

                <div class="flex items-center justify-center gap-4 py-2">
                    <div class="relative w-24 h-24 flex items-center justify-center flex-none">
                        <svg class="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="${radius}" stroke="${borderStrong}" stroke-width="8" fill="transparent"></circle>
                            <circle class="donut-ring" cx="50" cy="50" r="${radius}"
                                stroke="${primaryColor}" stroke-width="8" stroke-linecap="round" fill="transparent"
                                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashOffset};">
                            </circle>
                        </svg>
                        <div class="absolute flex flex-col items-center">
                            <span class="text-lg font-bold text-textMain">${routinePct}%</span>
                            <span class="text-[8px] font-semibold uppercase tracking-wider text-textMuted">Done</span>
                        </div>
                    </div>

                    <div class="h-20 w-3.5 bg-bg border border-border rounded-full flex items-end p-0.5 overflow-hidden flex-none shadow-inner" title="${routinePct}% Completed">
                        <div class="w-full bg-primary rounded-full vertical-fill" style="height: ${routinePct}%;"></div>
                    </div>
                </div>

                <div class="space-y-2.5 pt-1 border-t border-border min-w-0">
                    <div class="flex justify-between items-center text-[11px] font-bold text-textMain">
                        <span>Action Items</span>
                        <span class="text-[10px] font-semibold text-textMuted">${completedTasks}/${tasks.length}</span>
                    </div>

                    <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        ${tasks.map(task => `
                            <div class="flex items-center justify-between text-xs group py-0.5">
                                <label class="flex items-center gap-2 cursor-pointer truncate pr-1">
                                    <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleDailyTask('${dateKey}', ${task.id})" class="rounded border-borderStrong text-primary focus:ring-0 flex-none">
                                    <span class="truncate ${task.done ? 'line-through text-textMuted' : 'text-textMain'}">${task.text}</span>
                                </label>
                                <button onclick="deleteDailyTask('${dateKey}', ${task.id})" class="opacity-0 group-hover:opacity-100 text-textMuted hover:text-red-500 text-[11px] font-bold px-1 transition-opacity flex-none">&times;</button>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex items-center gap-1.5 pt-1 w-full">
                        <input type="text" id="input-task-${dateKey}" placeholder="Add task..."
                               onkeydown="if(event.key==='Enter') addDailyTask('${dateKey}')"
                               class="min-w-0 w-full flex-1 text-xs px-2.5 py-1.5 rounded-md border border-border bg-bg text-textMain outline-none focus:border-borderStrong">
                        <button onclick="addDailyTask('${dateKey}')" class="flex-none w-7 h-7 flex items-center justify-center text-xs font-bold bg-primary text-card rounded-md hover:opacity-90 transition-opacity" title="Add Task">+</button>
                    </div>
                </div>
            </div>
        `;
    }

    els.weeklySpread.innerHTML = cardsHTML;
}

function renderHeatmap() {
    let columnsHTML = '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const startDate = new Date(yearStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentDayPointer = new Date(startDate);
    let weeks = [];
    let currentWeek = [];

    while (currentDayPointer <= yearEnd || currentWeek.length > 0) {
        currentWeek.push(new Date(currentDayPointer));
        currentDayPointer.setDate(currentDayPointer.getDate() + 1);

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    let lastMonthRendered = -1;

    weeks.forEach((week, colIndex) => {
        let monthLabel = '';
        const weekMonth = colIndex === 0 ? 0 : week[0].getMonth();
        const weekYear = week[0].getFullYear();

        if (weekMonth !== lastMonthRendered && (weekYear === currentYear || colIndex === 0)) {
            monthLabel = monthNames[weekMonth];
            lastMonthRendered = weekMonth;
        }

        columnsHTML += `<div class="flex flex-col gap-1 flex-none">`;

        columnsHTML += `
            <div class="h-5 relative flex items-end pb-1">
                ${monthLabel ? `<span class="text-[11px] font-semibold text-textMuted absolute left-0 bottom-1 select-none leading-none">${monthLabel}</span>` : ''}
            </div>
        `;

        week.forEach((dateObj, dayIndex) => {
            if (dateObj.getFullYear() !== currentYear) {
                columnsHTML += `<div class="w-3.5 h-3.5 bg-transparent pointer-events-none"></div>`;
            } else {
                const y = dateObj.getFullYear();
                const m = dateObj.getMonth();
                const d = dateObj.getDate();

                let completed = 0;
                habits.forEach(h => {
                    if (progressData[generateKey(y, m, d, h.id)]) completed++;
                });

                const percent = habits.length === 0 ? 0 : completed / habits.length;

                let colorClass = 'bg-heatEmpty border border-border shadow-sm';
                let intensity = 0;
                if (percent > 0)   { colorClass = 'bg-heat1'; intensity = 1; }
                if (percent > 0.3) { colorClass = 'bg-heat2'; intensity = 2; }
                if (percent > 0.6) { colorClass = 'bg-heat3'; intensity = 3; }
                if (percent > 0.9) { colorClass = 'bg-heat4'; intensity = 4; }

                const tooltipDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const tooltipText = `${completed} completed on ${tooltipDate}`;
                const isCompleted = completed > 0;

                columnsHTML += `
                    <div class="heatmap-cell w-3.5 h-3.5 rounded-[3px] ${colorClass} cursor-pointer transition-transform hover:scale-110"
                         data-col="${colIndex}"
                         data-row="${dayIndex}"
                         data-completed="${isCompleted}"
                         data-intensity="${intensity}"
                         data-original-class="${colorClass}"
                         onmouseenter="showHeatmapTooltip(event, '${tooltipText}')"
                         onmouseleave="hideHeatmapTooltip()">
                    </div>
                `;
            }
        });

        columnsHTML += `</div>`;
    });

    els.heatmapColumns.innerHTML = columnsHTML;
}

window.showHeatmapTooltip = function(event, text) {
    if (isSnakeRunning) return;
    const tooltipEl = els.heatmapTooltip;
    if (!tooltipEl || !text) return;

    tooltipEl.textContent = text;
    tooltipEl.classList.remove('hidden');

    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    left = Math.max(12, Math.min(window.innerWidth - tooltipRect.width - 12, left));

    let top = rect.top - tooltipRect.height - 8;
    if (top < 12) {
        top = rect.bottom + 8;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
};

window.hideHeatmapTooltip = function() {
    if (els.heatmapTooltip) {
        els.heatmapTooltip.classList.add('hidden');
    }
};

window.addEventListener('scroll', hideHeatmapTooltip, true);

let dailyChartInstance = null;

function calculateDailyStats(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    let dailyData = new Array(daysInMonth).fill(0);
    Object.keys(progressData).forEach(key => {
        const [y, m, d, hId] = key.split('-');
        if (parseInt(y) === year && parseInt(m) === month && habits.some(h => h.id == hId)) {
            dailyData[parseInt(d) - 1]++;
        }
    });
    return dailyData;
}

function initCharts() {
    const ctxDaily = document.getElementById('dailyChart').getContext('2d');
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const dailyLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);

    Chart.defaults.font.family = "'Inter', sans-serif";

    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--primary').trim() || '#0f172a';
    const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';
    const border = style.getPropertyValue('--border').trim() || '#f1f5f9';

    Chart.defaults.color = textMuted;

    dailyChartInstance = new Chart(ctxDaily, {
        type: 'bar',
        data: {
            labels: dailyLabels,
            datasets: [{
                label: 'Tasks',
                data: calculateDailyStats(currentYear, currentMonth),
                backgroundColor: primaryColor,
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: habits.length,
                    grid: { color: border, drawBorder: false },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });
}

function updateCharts() {
    if (!dailyChartInstance) return;
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);

    if (dailyChartInstance.data.labels.length !== daysInMonth) {
        dailyChartInstance.data.labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    }

    dailyChartInstance.data.datasets[0].data = calculateDailyStats(currentYear, currentMonth);
    dailyChartInstance.options.scales.y.suggestedMax = habits.length;

    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--primary').trim();
    dailyChartInstance.data.datasets[0].backgroundColor = primaryColor;

    dailyChartInstance.update();
}

function updateChartColors() {
    if (!dailyChartInstance) return;
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--primary').trim();
    const textMuted = style.getPropertyValue('--text-muted').trim();
    const border = style.getPropertyValue('--border-strong').trim();

    Chart.defaults.color = textMuted;
    dailyChartInstance.data.datasets[0].backgroundColor = primaryColor;
    dailyChartInstance.options.scales.y.grid.color = border;
    dailyChartInstance.options.scales.x.ticks.color = textMuted;
    dailyChartInstance.options.scales.y.ticks.color = textMuted;

    dailyChartInstance.update({
        duration: 400,
        easing: 'easeOutQuart'
    });

    renderWeeklySpread();
}

window.addEventListener('DOMContentLoaded', init);
