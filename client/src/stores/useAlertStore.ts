import { create } from "zustand";
import type { AlertType } from "@interfaces/ui";

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertStore {
    alerts: Alert[];
    addAlert: (type: AlertType, message: string) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
    alerts: [],

    addAlert: (type: AlertType, message: string) => {
        const id = `alert-${Date.now()} - ${Math.random().toString(36).substr(2, 9)}`;

    set((state) => ({
        alerts: [...state.alerts, { id, type, message }],
    }));
    },

    removeAlert: (id: string) => {
    set((state) => ({
        alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
    },

    clearAlerts: () => {
    set({ alerts: [] });
    },
}));