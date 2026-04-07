import {
    buildReflection,
    buildReminders,
    buildSavingsItem,
    buildTwelveMonthProjection,
    convertToBase,
    getDashboardMetrics,
    getFilteredSubscriptions,
    getMonthlyCost,
    getReminderSummary,
    getSavingsCandidates,
    getYearlyCost,
    groupByCategory
} from "./analysis.js";
import {
    cycleLabel,
    formatCurrency,
    formatDate
} from "./utils.js";

export function createUI(actions) {
    const elements = cacheElements();
    bindEvents(elements, actions);

    return {
        populateFilters(subscriptions) {
            populateFilters(elements, subscriptions);
        },

        syncSettingsForm(settings) {
            elements.monthlyBudget.value = settings.monthlyBudget || "";
            elements.baseCurrency.value = settings.baseCurrency;
            elements.rateEUR.value = settings.exchangeRates.EUR;
            elements.rateUSD.value = settings.exchangeRates.USD;
            elements.rateGBP.value = settings.exchangeRates.GBP;
            elements.rateCHF.value = settings.exchangeRates.CHF;
        },

        resetForm(baseCurrency) {
            elements.subscriptionForm.reset();
            elements.subscriptionId.value = "";
            elements.currency.value = baseCurrency;
            elements.cycle.value = "monthly";
            elements.reminderDaysBefore.value = 7;
            elements.usageCount.value = 0;
            elements.valueScore.value = 5;
            elements.autoRenew.checked = true;
            elements.active.checked = true;
        },

        populateForm(subscription) {
            switchView(elements, "subscriptions");
            elements.subscriptionId.value = subscription.id;
            elements.name.value = subscription.name;
            elements.category.value = subscription.category;
            elements.amount.value = subscription.amount;
            elements.currency.value = subscription.currency;
            elements.cycle.value = subscription.cycle;
            elements.nextPaymentDate.value = subscription.nextPaymentDate;
            elements.startDate.value = subscription.startDate || "";
            elements.endDate.value = subscription.endDate || "";
            elements.cancelDeadline.value = subscription.cancelDeadline || "";
            elements.reminderDaysBefore.value = subscription.reminderDaysBefore ?? 7;
            elements.usageCount.value = subscription.usageCount ?? 0;
            elements.valueScore.value = subscription.valueScore ?? 5;
            elements.notes.value = subscription.notes || "";
            elements.autoRenew.checked = Boolean(subscription.autoRenew);
            elements.active.checked = Boolean(subscription.active);
            elements.name.focus();
        },

        readSubscriptionForm() {
            const data = {
                id: elements.subscriptionId.value || "",
                name: elements.name.value.trim(),
                category: elements.category.value,
                amount: Number(elements.amount.value),
                currency: elements.currency.value,
                cycle: elements.cycle.value,
                nextPaymentDate: elements.nextPaymentDate.value,
                startDate: elements.startDate.value,
                endDate: elements.endDate.value,
                cancelDeadline: elements.cancelDeadline.value,
                reminderDaysBefore: Number(elements.reminderDaysBefore.value || 0),
                usageCount: Number(elements.usageCount.value || 0),
                valueScore: Number(elements.valueScore.value || 5),
                notes: elements.notes.value.trim(),
                autoRenew: elements.autoRenew.checked,
                active: elements.active.checked
            };

            if (!data.name || !data.category || !data.nextPaymentDate || Number.isNaN(data.amount) || data.amount < 0) {
                window.alert("Bitte Name, Kategorie, Preis und naechstes Zahlungsdatum korrekt ausfuellen.");
                return null;
            }

            return data;
        },

        readSettingsForm() {
            return {
                monthlyBudget: Number(elements.monthlyBudget.value || 0),
                baseCurrency: elements.baseCurrency.value,
                exchangeRates: {
                    EUR: Number(elements.rateEUR.value || 1),
                    USD: Number(elements.rateUSD.value || 1),
                    GBP: Number(elements.rateGBP.value || 1),
                    CHF: Number(elements.rateCHF.value || 1)
                }
            };
        },

        getCurrentSubscriptionId() {
            return elements.subscriptionId.value;
        },

        getFilters() {
            return {
                search: elements.searchInput.value.trim().toLowerCase(),
                category: elements.filterCategory.value,
                status: elements.filterStatus.value,
                sort: elements.sortSelect.value
            };
        },

        render(state) {
            const filters = this.getFilters();
            const filteredSubscriptions = getFilteredSubscriptions(state.subscriptions, filters, state.settings);
            const metrics = getDashboardMetrics(state);

            renderSubscriptionList(elements, filteredSubscriptions, state, actions);
            renderDashboard(elements, state, metrics);
            renderInsights(elements, state);
            renderReminders(elements, state);
            syncSidebar(elements, metrics, state.settings);
        },

        switchToForm() {
            switchView(elements, "subscriptions");
            elements.name.focus();
        },

        logImport(message) {
            elements.importLog.textContent = message;
        }
    };
}

function cacheElements() {
    return {
        subscriptionForm: document.getElementById("subscription-form"),
        settingsForm: document.getElementById("settings-form"),
        subscriptionId: document.getElementById("subscription-id"),
        name: document.getElementById("name"),
        category: document.getElementById("category"),
        amount: document.getElementById("amount"),
        currency: document.getElementById("currency"),
        cycle: document.getElementById("cycle"),
        nextPaymentDate: document.getElementById("nextPaymentDate"),
        startDate: document.getElementById("startDate"),
        endDate: document.getElementById("endDate"),
        cancelDeadline: document.getElementById("cancelDeadline"),
        reminderDaysBefore: document.getElementById("reminderDaysBefore"),
        usageCount: document.getElementById("usageCount"),
        valueScore: document.getElementById("valueScore"),
        notes: document.getElementById("notes"),
        autoRenew: document.getElementById("autoRenew"),
        active: document.getElementById("active"),
        subscriptionList: document.getElementById("subscription-list"),
        searchInput: document.getElementById("search-input"),
        filterCategory: document.getElementById("filter-category"),
        filterStatus: document.getElementById("filter-status"),
        sortSelect: document.getElementById("sort-select"),
        monthlyTotal: document.getElementById("monthly-total"),
        yearlyTotal: document.getElementById("yearly-total"),
        nextPaymentMetric: document.getElementById("next-payment-metric"),
        nextPaymentCaption: document.getElementById("next-payment-caption"),
        deadlineMetric: document.getElementById("deadline-metric"),
        deadlineCaption: document.getElementById("deadline-caption"),
        monthlyBudgetCaption: document.getElementById("monthly-budget-caption"),
        yearlySavingsCaption: document.getElementById("yearly-savings-caption"),
        categoryChart: document.getElementById("category-chart"),
        timelineChart: document.getElementById("timeline-chart"),
        savingsList: document.getElementById("savings-list"),
        reminderPreview: document.getElementById("reminder-preview"),
        remindersList: document.getElementById("reminders-list"),
        categoryComparison: document.getElementById("category-comparison"),
        reflectionCards: document.getElementById("reflection-cards"),
        statsGrid: document.getElementById("stats-grid"),
        insightSavings: document.getElementById("insight-savings"),
        monthlyBudget: document.getElementById("monthlyBudget"),
        baseCurrency: document.getElementById("baseCurrency"),
        rateEUR: document.getElementById("rateEUR"),
        rateUSD: document.getElementById("rateUSD"),
        rateGBP: document.getElementById("rateGBP"),
        rateCHF: document.getElementById("rateCHF"),
        sidebarActiveCount: document.getElementById("sidebar-active-count"),
        sidebarBudgetStatus: document.getElementById("sidebar-budget-status"),
        importLog: document.getElementById("import-log"),
        filterInputs: [
            document.getElementById("search-input"),
            document.getElementById("filter-category"),
            document.getElementById("filter-status"),
            document.getElementById("sort-select")
        ]
    };
}

function bindEvents(elements, actions) {
    document.querySelectorAll(".nav-link").forEach((button) => {
        button.addEventListener("click", () => switchView(elements, button.dataset.target));
    });

    elements.subscriptionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        actions.onSaveSubscription();
    });

    elements.settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        actions.onSaveSettings();
    });

    elements.filterInputs.forEach((element) => {
        element.addEventListener("input", actions.onFiltersChanged);
        element.addEventListener("change", actions.onFiltersChanged);
    });

    document.getElementById("reset-form").addEventListener("click", actions.onResetForm);
    document.getElementById("load-sample").addEventListener("click", actions.onLoadSample);
    document.getElementById("seed-demo-data").addEventListener("click", actions.onLoadSample);
    document.getElementById("export-csv").addEventListener("click", actions.onExportCsv);
    document.getElementById("import-csv").addEventListener("change", (event) => actions.onImportCsv(event.target.files?.[0], event.target));
    document.getElementById("clear-data").addEventListener("click", actions.onClearAll);
    document.getElementById("jump-to-form").addEventListener("click", actions.onJumpToForm);
    document.getElementById("duplicate-selected").addEventListener("click", actions.onDuplicateSelected);
    document.getElementById("export-json").addEventListener("click", actions.onExportJson);
    document.getElementById("import-json").addEventListener("change", (event) => actions.onImportJson(event.target.files?.[0], event.target));
    window.addEventListener("resize", actions.onResize);
}

function switchView(elements, target) {
    document.querySelectorAll(".nav-link").forEach((button) => {
        button.classList.toggle("active", button.dataset.target === target);
    });

    document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active", view.id === target);
    });
}

function populateFilters(elements, subscriptions) {
    const categories = [...new Set(subscriptions.map((item) => item.category))].filter(Boolean).sort();
    const current = elements.filterCategory.value || "all";
    elements.filterCategory.innerHTML = '<option value="all">Alle Kategorien</option>';

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        elements.filterCategory.appendChild(option);
    });

    elements.filterCategory.value = categories.includes(current) ? current : "all";
}

function renderSubscriptionList(elements, subscriptions, state, actions) {
    const container = elements.subscriptionList;
    container.innerHTML = "";

    if (!subscriptions.length) {
        container.className = "subscription-list empty-state";
        container.textContent = "Noch keine passenden Abos gefunden.";
        return;
    }

    const reminders = buildReminders(state.subscriptions);
    container.className = "subscription-list";

    subscriptions.forEach((subscription) => {
        const template = document.getElementById("subscription-card-template");
        const card = template.content.firstElementChild.cloneNode(true);
        const monthlyCost = getMonthlyCost(state.settings, subscription);
        const reminderText = getReminderSummary(subscription);

        card.querySelector("h4").textContent = subscription.name;
        card.querySelector(".card-meta").textContent = `${subscription.category} · ${formatCurrency(subscription.amount, subscription.currency)} · ${cycleLabel(subscription.cycle)}`;

        const status = card.querySelector(".status-pill");
        const isRisky = reminders.some((item) => item.title === subscription.name && item.severity === "danger");
        status.textContent = subscription.active ? "Aktiv" : "Inaktiv";
        status.className = `status-pill ${subscription.active ? "" : "inactive"} ${isRisky ? "warning" : ""}`.trim();

        const body = card.querySelector(".card-body");
        body.appendChild(infoLine("Monatlich hochgerechnet", formatCurrency(monthlyCost, state.settings.baseCurrency)));
        body.appendChild(infoLine("Naechste Zahlung", formatDate(subscription.nextPaymentDate)));
        body.appendChild(infoLine("Kuendigungsfrist", subscription.cancelDeadline ? formatDate(subscription.cancelDeadline) : "Keine"));
        body.appendChild(infoLine("Nutzen", `${subscription.valueScore}/10 · ${subscription.usageCount} Nutzungen / Monat`));
        body.appendChild(infoLine("Hinweis", reminderText));

        card.querySelector(".edit-btn").addEventListener("click", () => actions.onEditSubscription(subscription));
        card.querySelector(".delete-btn").addEventListener("click", () => actions.onDeleteSubscription(subscription));
        container.appendChild(card);
    });
}

function renderDashboard(elements, state, metrics) {
    elements.monthlyTotal.textContent = formatCurrency(metrics.monthlyTotal, state.settings.baseCurrency);
    elements.yearlyTotal.textContent = formatCurrency(metrics.yearlyTotal, state.settings.baseCurrency);
    elements.nextPaymentMetric.textContent = metrics.nextPayment ? formatDate(metrics.nextPayment.nextPaymentDate) : "-";
    elements.nextPaymentCaption.textContent = metrics.nextPayment
        ? `${metrics.nextPayment.name} · ${formatCurrency(convertToBase(state.settings, metrics.nextPayment.amount, metrics.nextPayment.currency), state.settings.baseCurrency)}`
        : "Noch keine Zahlungen geplant";
    elements.deadlineMetric.textContent = String(metrics.reminders.filter((item) => item.severity === "danger").length);
    elements.deadlineCaption.textContent = metrics.reminders.length ? `${metrics.reminders.length} Erinnerung(en) in Sicht` : "Alles ruhig";

    const budget = Number(state.settings.monthlyBudget || 0);
    if (budget > 0) {
        const difference = budget - metrics.monthlyTotal;
        elements.monthlyBudgetCaption.textContent = difference >= 0
            ? `${formatCurrency(difference, state.settings.baseCurrency)} bis zum Budget`
            : `${formatCurrency(Math.abs(difference), state.settings.baseCurrency)} ueber Budget`;
    } else {
        elements.monthlyBudgetCaption.textContent = "Kein Budget gesetzt";
    }

    const savingsTotal = metrics.savings.reduce((total, item) => total + getYearlyCost(state.settings, item), 0);
    elements.yearlySavingsCaption.textContent = metrics.savings.length
        ? `${formatCurrency(savingsTotal, state.settings.baseCurrency)} potenzielle Jahresersparnis`
        : "Keine Einsparung markiert";

    renderCategoryChart(elements.categoryChart, state.settings, metrics.activeSubscriptions);
    renderTimelineChart(elements.timelineChart, state);
    renderList(elements.savingsList, metrics.savings.map((item) => buildSavingsItem(state.settings, item)), "Aktuell keine klaren Einsparkandidaten.");
    renderList(elements.reminderPreview, metrics.reminders.slice(0, 5), "Keine Erinnerungen in den naechsten Wochen.");
}

function renderInsights(elements, state) {
    renderCategoryComparison(elements.categoryComparison, state);
    renderReflectionCards(elements.reflectionCards, state);
    renderStats(elements.statsGrid, state);
    renderList(
        elements.insightSavings,
        getSavingsCandidates(state.settings, state.subscriptions).map((item) => buildSavingsItem(state.settings, item)),
        "Keine auffaelligen Abo-Kandidaten entdeckt."
    );
}

function renderReminders(elements, state) {
    renderList(elements.remindersList, buildReminders(state.subscriptions), "Keine faelligen Erinnerungen gefunden.");
}

function syncSidebar(elements, metrics, settings) {
    const budget = Number(settings.monthlyBudget || 0);
    elements.sidebarActiveCount.textContent = String(metrics.activeSubscriptions.length);
    elements.sidebarBudgetStatus.textContent = budget > 0
        ? (metrics.monthlyTotal <= budget ? "Im Ziel" : "Zu hoch")
        : "Offen";
}

function renderCategoryChart(container, settings, subscriptions) {
    const totals = {};
    container.innerHTML = "";

    subscriptions.forEach((subscription) => {
        totals[subscription.category] = (totals[subscription.category] || 0) + getMonthlyCost(settings, subscription);
    });

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        container.className = "bar-chart empty-state";
        container.textContent = "Sobald du Abos anlegst, erscheint hier deine Kostenstruktur.";
        return;
    }

    container.className = "bar-chart";
    const max = entries[0][1];

    entries.forEach(([category, total]) => {
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
            <span>${category}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(total / max) * 100}%"></div></div>
            <strong>${formatCurrency(total, settings.baseCurrency)}</strong>
        `;
        container.appendChild(row);
    });
}

function renderTimelineChart(canvas, state) {
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 640;
    const height = 280;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const projection = buildTwelveMonthProjection(state.settings, state.subscriptions);
    if (!projection.some((item) => item.total > 0)) {
        context.fillStyle = "#706255";
        context.font = "16px Bahnschrift";
        context.fillText("Die Kostenentwicklung erscheint hier nach dem ersten Abo.", 24, 140);
        return;
    }

    const padding = { top: 28, right: 18, bottom: 44, left: 44 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...projection.map((item) => item.total), 10);

    context.strokeStyle = "rgba(74,57,42,0.14)";
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index++) {
        const y = padding.top + (chartHeight / 4) * index;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();
    }

    context.beginPath();
    projection.forEach((item, index) => {
        const x = padding.left + (chartWidth / (projection.length - 1 || 1)) * index;
        const y = padding.top + chartHeight - (item.total / maxValue) * chartHeight;
        if (index === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    });
    context.strokeStyle = "#156064";
    context.lineWidth = 3;
    context.stroke();

    projection.forEach((item, index) => {
        const x = padding.left + (chartWidth / (projection.length - 1 || 1)) * index;
        const y = padding.top + chartHeight - (item.total / maxValue) * chartHeight;
        context.fillStyle = "#ff7d00";
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "#2b221c";
        context.font = "12px Bahnschrift";
        context.textAlign = "center";
        context.fillText(item.label, x, height - 16);
    });
}

function renderCategoryComparison(container, state) {
    container.innerHTML = "";
    const grouped = groupByCategory(state.subscriptions);
    const categories = Object.entries(grouped).filter(([, list]) => list.length > 0);

    if (!categories.length) {
        container.className = "comparison-grid empty-state";
        container.textContent = "Kategorievergleiche erscheinen, sobald du Abos angelegt hast.";
        return;
    }

    container.className = "comparison-grid";
    categories.forEach(([category, list]) => {
        const monthly = list.reduce((total, item) => total + getMonthlyCost(state.settings, item), 0);
        const expensive = list.reduce((max, item) => getMonthlyCost(state.settings, item) > getMonthlyCost(state.settings, max) ? item : max, list[0]);
        const card = document.createElement("article");
        card.className = "comparison-card";
        card.innerHTML = `
            <div class="comparison-head">
                <strong>${category}</strong>
                <span class="tag">${list.length} Abos</span>
            </div>
            <p>Gesamt pro Monat: ${formatCurrency(monthly, state.settings.baseCurrency)}</p>
            <p>Teuerstes Abo: ${expensive.name}</p>
            <p>Empfehlung: ${list.length > 1 ? "Vergleiche Ueberschneidungen in dieser Kategorie." : "Derzeit kein direkter Kategorie-Konflikt."}</p>
        `;
        container.appendChild(card);
    });
}

function renderReflectionCards(container, state) {
    const subscriptions = state.subscriptions.filter((item) => item.active);
    container.innerHTML = "";

    if (!subscriptions.length) {
        container.className = "reflection-grid empty-state";
        container.textContent = "Reflexionskarten erscheinen nach dem Anlegen aktiver Abos.";
        return;
    }

    container.className = "reflection-grid";
    subscriptions.forEach((subscription) => {
        const monthlyCost = getMonthlyCost(state.settings, subscription);
        const card = document.createElement("article");
        card.className = "reflection-card";
        card.innerHTML = `
            <strong>${subscription.name}</strong>
            <p>Monatlich gerechnet: ${formatCurrency(monthlyCost, state.settings.baseCurrency)}</p>
            <p>Nutzenwert: ${subscription.valueScore}/10 bei ${subscription.usageCount} Nutzungen pro Monat</p>
            <p>${buildReflection(state.settings, subscription)}</p>
        `;
        container.appendChild(card);
    });
}

function renderStats(container, state) {
    const active = state.subscriptions.filter((item) => item.active);
    const potentialSavings = getSavingsCandidates(state.settings, state.subscriptions);
    const stats = [
        {
            label: "Aktive Abos",
            value: String(active.length),
            detail: "Laufende Vertraege und Services"
        },
        {
            label: "Durchschnittlicher Monatswert",
            value: formatCurrency(active.length ? active.reduce((total, item) => total + getMonthlyCost(state.settings, item), 0) / active.length : 0, state.settings.baseCurrency),
            detail: "Mittlere Belastung pro Abo"
        },
        {
            label: "Potenzielle Jahresersparnis",
            value: formatCurrency(potentialSavings.reduce((total, item) => total + getYearlyCost(state.settings, item), 0), state.settings.baseCurrency),
            detail: "Falls markierte Kandidaten gekuendigt werden"
        },
        {
            label: "Niedrige Nutzung",
            value: String(active.filter((item) => item.usageCount <= 2).length),
            detail: "Abos mit sehr seltener Nutzung"
        }
    ];

    container.innerHTML = "";
    stats.forEach((stat) => {
        const card = document.createElement("article");
        card.className = "stat-card";
        card.innerHTML = `
            <div>
                <p>${stat.label}</p>
                <strong>${stat.value}</strong>
            </div>
            <span>${stat.detail}</span>
        `;
        container.appendChild(card);
    });
}

function renderList(container, items, emptyText) {
    container.innerHTML = "";

    if (!items.length) {
        container.className = "list-shell empty-state";
        container.textContent = emptyText;
        return;
    }

    container.className = "list-shell";
    items.forEach((item) => {
        const node = document.createElement("article");
        node.className = "list-item";
        const severityClass = item.severity === "danger" ? "danger" : "";
        node.innerHTML = `
            <div>
                <strong>${item.title}</strong>
                <p>${item.description}</p>
            </div>
            <span class="tag ${severityClass}">${item.tag}</span>
        `;
        container.appendChild(node);
    });
}

function infoLine(label, value) {
    const line = document.createElement("p");
    line.innerHTML = `<strong>${label}:</strong> ${value}`;
    return line;
}
