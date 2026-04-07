export function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `sg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function parseDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

export function toInputDate(date) {
    return date.toISOString().slice(0, 10);
}

export function addDays(date, amount) {
    const copy = startOfDay(date);
    copy.setDate(copy.getDate() + amount);
    return toInputDate(copy);
}

export function diffDays(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

export function advanceCycle(date, cycle) {
    const copy = new Date(date);

    switch (cycle) {
        case "weekly":
            copy.setDate(copy.getDate() + 7);
            break;
        case "quarterly":
            copy.setMonth(copy.getMonth() + 3);
            break;
        case "yearly":
            copy.setFullYear(copy.getFullYear() + 1);
            break;
        default:
            copy.setMonth(copy.getMonth() + 1);
            break;
    }

    return copy;
}

export function cycleLabel(cycle) {
    const labels = {
        weekly: "Woechentlich",
        monthly: "Monatlich",
        quarterly: "Quartalsweise",
        yearly: "Jaehrlich"
    };

    return labels[cycle] || cycle;
}

export function formatDate(value) {
    const date = parseDate(value);
    return date ? date.toLocaleDateString("de-DE") : "-";
}

export function formatCurrency(amount, currency) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency
    }).format(amount || 0);
}

export function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sum(values) {
    return roundCurrency(values.reduce((total, value) => total + value, 0));
}

export function severityWeight(value) {
    if (value === "danger") {
        return 3;
    }

    if (value === "warning") {
        return 2;
    }

    return 1;
}

export function csvEscape(value) {
    const stringValue = String(value);

    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export function parseCsv(text) {
    const rows = [];
    let row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            i += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
                i += 1;
            }

            row.push(current);
            if (row.some((value) => value.length > 0)) {
                rows.push(row);
            }

            row = [];
            current = "";
        } else {
            current += char;
        }
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current);
        rows.push(row);
    }

    return rows;
}

export function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
