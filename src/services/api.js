import { STORAGE_KEY } from "../constants.js";
import { clone } from "../utils.js";
import { loadLocalState, sanitizeState, saveLocalState } from "./localRepository.js";

export function createDataSource(options = {}) {
    const mode = options.mode || "local";

    if (mode === "remote") {
        return createRemoteDataSource(options.baseUrl || "");
    }

    return createLocalDataSource();
}

function createLocalDataSource() {
    let state = loadLocalState(STORAGE_KEY);

    return {
        async getState() {
            return clone(state);
        },

        async importState(nextState) {
            state = sanitizeState(nextState);
            saveLocalState(STORAGE_KEY, state);
            return clone(state);
        },

        async replaceSubscriptions(subscriptions) {
            state.subscriptions = clone(subscriptions);
            saveLocalState(STORAGE_KEY, state);
            return clone(state);
        },

        async saveSubscription(subscription) {
            const index = state.subscriptions.findIndex((item) => item.id === subscription.id);

            if (index >= 0) {
                state.subscriptions[index] = clone(subscription);
            } else {
                state.subscriptions.unshift(clone(subscription));
            }

            saveLocalState(STORAGE_KEY, state);
            return clone(subscription);
        },

        async deleteSubscription(id) {
            state.subscriptions = state.subscriptions.filter((item) => item.id !== id);
            saveLocalState(STORAGE_KEY, state);
        },

        async saveSettings(settings) {
            state.settings = clone(settings);
            saveLocalState(STORAGE_KEY, state);
            return clone(settings);
        },

        async clearAll() {
            state = sanitizeState({});
            saveLocalState(STORAGE_KEY, state);
            return clone(state);
        }
    };
}

function createRemoteDataSource(baseUrl) {
    return {
        async getState() {
            const response = await fetch(`${baseUrl}/state`);
            return response.json();
        },

        async importState(nextState) {
            const response = await fetch(`${baseUrl}/state/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nextState)
            });
            return response.json();
        },

        async replaceSubscriptions(subscriptions) {
            const response = await fetch(`${baseUrl}/subscriptions/replace`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptions })
            });
            return response.json();
        },

        async saveSubscription(subscription) {
            const method = subscription.id ? "PUT" : "POST";
            const url = subscription.id ? `${baseUrl}/subscriptions/${subscription.id}` : `${baseUrl}/subscriptions`;
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription)
            });
            return response.json();
        },

        async deleteSubscription(id) {
            await fetch(`${baseUrl}/subscriptions/${id}`, { method: "DELETE" });
        },

        async saveSettings(settings) {
            const response = await fetch(`${baseUrl}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            return response.json();
        },

        async clearAll() {
            const response = await fetch(`${baseUrl}/state`, { method: "DELETE" });
            return response.json();
        }
    };
}
