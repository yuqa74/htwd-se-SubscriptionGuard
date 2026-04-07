import { CSV_FIELDS } from "./constants.js";
import { createDataSource } from "./services/api.js";
import { getSampleSubscriptions } from "./data/sampleSubscriptions.js";
import { createUI } from "./ui.js";
import { createId, csvEscape, downloadFile, parseCsv } from "./utils.js";

export async function initApp() {
    const dataSource = createDataSource({ mode: "local" });
    let state = await dataSource.getState();

    const ui = createUI({
        onSaveSubscription: handleSaveSubscription,
        onSaveSettings: handleSaveSettings,
        onFiltersChanged: () => ui.render(state),
        onResetForm: () => ui.resetForm(state.settings.baseCurrency),
        onLoadSample: handleLoadSample,
        onExportCsv: handleExportCsv,
        onImportCsv: handleImportCsv,
        onClearAll: handleClearAll,
        onJumpToForm: () => ui.switchToForm(),
        onDuplicateSelected: handleDuplicateSelected,
        onExportJson: handleExportJson,
        onImportJson: handleImportJson,
        onResize: () => ui.render(state),
        onEditSubscription: (subscription) => ui.populateForm(subscription),
        onDeleteSubscription: handleDeleteSubscription
    });

    ui.populateFilters(state.subscriptions);
    ui.syncSettingsForm(state.settings);
    ui.resetForm(state.settings.baseCurrency);
    ui.render(state);

    async function refreshState() {
        state = await dataSource.getState();
        ui.populateFilters(state.subscriptions);
        ui.syncSettingsForm(state.settings);
        ui.render(state);
    }

    async function handleSaveSubscription() {
        const subscription = ui.readSubscriptionForm();
        if (!subscription) {
            return;
        }

        subscription.id = subscription.id || createId();
        await dataSource.saveSubscription(subscription);
        await refreshState();
        ui.resetForm(state.settings.baseCurrency);
    }

    async function handleSaveSettings() {
        await dataSource.saveSettings(ui.readSettingsForm());
        await refreshState();
        ui.logImport("Einstellungen gespeichert.");
    }

    async function handleLoadSample() {
        await dataSource.replaceSubscriptions(getSampleSubscriptions());
        await refreshState();
        ui.resetForm(state.settings.baseCurrency);
        ui.logImport("Demo-Daten wurden geladen.");
    }

    async function handleDeleteSubscription(subscription) {
        if (!window.confirm(`"${subscription.name}" wirklich loeschen?`)) {
            return;
        }

        await dataSource.deleteSubscription(subscription.id);
        await refreshState();

        if (ui.getCurrentSubscriptionId() === subscription.id) {
            ui.resetForm(state.settings.baseCurrency);
        }
    }

    async function handleDuplicateSelected() {
        const currentId = ui.getCurrentSubscriptionId();
        if (!currentId) {
            window.alert("Bitte zuerst ein vorhandenes Abo zum Duplizieren auswaehlen.");
            return;
        }

        const original = state.subscriptions.find((item) => item.id === currentId);
        if (!original) {
            return;
        }

        const copy = {
            ...original,
            id: createId(),
            name: `${original.name} Kopie`
        };

        await dataSource.saveSubscription(copy);
        await refreshState();
        ui.populateForm(copy);
    }

    function handleExportCsv() {
        const lines = state.subscriptions.map((item) => CSV_FIELDS.map((key) => csvEscape(item[key] ?? "")).join(","));
        const csv = [CSV_FIELDS.join(","), ...lines].join("\n");
        downloadFile(csv, "subscriptionguard-export.csv", "text/csv;charset=utf-8");
    }

    function handleExportJson() {
        downloadFile(JSON.stringify(state, null, 2), "subscriptionguard-backup.json", "application/json");
    }

    async function handleImportJson(file, input) {
        if (!file) {
            return;
        }

        const text = await readFile(file);

        try {
            await dataSource.importState(JSON.parse(text));
            await refreshState();
            ui.resetForm(state.settings.baseCurrency);
            ui.logImport("Backup wurde erfolgreich importiert.");
        } catch (error) {
            ui.logImport(`Backup-Import fehlgeschlagen: ${error.message}`);
        } finally {
            input.value = "";
        }
    }

    async function handleImportCsv(file, input) {
        if (!file) {
            return;
        }

        try {
            const rows = parseCsv(await readFile(file));
            if (rows.length < 2) {
                throw new Error("Die CSV enthaelt keine Datensaetze.");
            }

            const [header, ...records] = rows;
            const imported = records
                .filter((row) => row.some((value) => value.trim() !== ""))
                .map((row) => rowToSubscription(header, row));

            await dataSource.replaceSubscriptions([...imported, ...state.subscriptions]);
            await refreshState();
            ui.logImport(`${imported.length} Datensaetze aus CSV importiert.`);
        } catch (error) {
            ui.logImport(`CSV-Import fehlgeschlagen: ${error.message}`);
        } finally {
            input.value = "";
        }
    }

    async function handleClearAll() {
        if (!window.confirm("Alle lokalen Daten wirklich loeschen?")) {
            return;
        }

        await dataSource.clearAll();
        await refreshState();
        ui.resetForm(state.settings.baseCurrency);
        ui.logImport("Alle Daten wurden geloescht.");
    }
}

function rowToSubscription(header, row) {
    const record = {};
    header.forEach((key, index) => {
        record[key] = row[index] ?? "";
    });

    return {
        id: createId(),
        name: record.name?.trim() || "Unbenanntes Abo",
        category: record.category?.trim() || "Sonstiges",
        amount: Number(record.amount || 0),
        currency: record.currency || "EUR",
        cycle: record.cycle || "monthly",
        nextPaymentDate: record.nextPaymentDate || new Date().toISOString().slice(0, 10),
        startDate: record.startDate || "",
        endDate: record.endDate || "",
        cancelDeadline: record.cancelDeadline || "",
        reminderDaysBefore: Number(record.reminderDaysBefore || 7),
        usageCount: Number(record.usageCount || 0),
        valueScore: Number(record.valueScore || 5),
        autoRenew: String(record.autoRenew).toLowerCase() !== "false",
        active: String(record.active).toLowerCase() !== "false",
        notes: record.notes || ""
    };
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
        reader.readAsText(file, "utf-8");
    });
}
