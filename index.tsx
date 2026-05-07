/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    padHours: {
        type: OptionType.BOOLEAN,
        description: "Pad hours with a leading zero (e.g., 09:00 vs 9:00)",
        default: false
    },
    use24h: {
        type: OptionType.BOOLEAN,
        description: "Use 24-hour time format instead of 12-hour AM/PM",
        default: false
    }
});

function formatTime(date: Date): string {
    const hours24 = date.getHours();

    const use24h = settings.store.use24h;
    const padHours = settings.store.padHours;

    let hStr: string;
    let ampm = "";

    if (use24h) {
        hStr = padHours ? hours24.toString().padStart(2, "0") : hours24.toString();
    } else {
        ampm = hours24 >= 12 ? " PM" : " AM";
        const hours12 = hours24 % 12 || 12;
        hStr = padHours ? hours12.toString().padStart(2, "0") : hours12.toString();
    }

    const m = date.getMinutes().toString().padStart(2, "0");
    const s = date.getSeconds().toString().padStart(2, "0");

    return `${hStr}:${m}:${s}${ampm}`;
}

function updateTimestamp(timeEl: HTMLTimeElement) {
    const dt = timeEl.getAttribute("datetime");
    if (!dt) return;
    const date = new Date(dt);
    if (isNaN(date.getTime())) return;

    for (const node of Array.from(timeEl.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            node.textContent = formatTime(date);
            return;
        }
    }

    timeEl.appendChild(document.createTextNode(formatTime(date)));
}

function updateAll() {
    document.querySelectorAll<HTMLTimeElement>("time[datetime]").forEach(updateTimestamp);
}

let observer: MutationObserver | null = null;

export default definePlugin({
    name: "blueTimestamps",
    description: "Shows seconds in message timestamps",
    authors: [{ id: 585517584137453611n, name: "blue" }],

    settings,

    start() {
        updateAll();

        observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof Element) {
                        node.querySelectorAll<HTMLTimeElement>("time[datetime]").forEach(updateTimestamp);
                        if (node instanceof HTMLTimeElement && node.hasAttribute("datetime")) {
                            updateTimestamp(node);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
    },
});
