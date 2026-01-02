import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@services/admin.api";
import type { SystemConfig } from "@interfaces/admin";
import { useAlertStore } from "@stores/useAlertStore";
import { Settings, Clock, Timer, Gavel, RotateCcw } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import ConfirmationModal from "@components/ui/ConfirmationModal";

const DEFAULT_WINDOW = 5;
const DEFAULT_TIME = 10;
const DEFAULT_DELAY = 1000;

const AdminSystemConfigContainer: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { addAlert } = useAlertStore();

  const [extensionWindow, setExtensionWindow] = useState<string>("");
  const [extensionTime, setExtensionTime] = useState<string>("");
  const [autoBidDelay, setAutoBidDelay] = useState<string>("");

  const [savingWindow, setSavingWindow] = useState(false);
  const [savingTime, setSavingTime] = useState(false);
  const [savingDelay, setSavingDelay] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    field: "window" | "time" | "delay";
    value: number;
    fieldName: string;
  } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSystemConfig();
      setConfig(data);
      setExtensionWindow(data.auctionExtensionWindow.toString());
      setExtensionTime(data.auctionExtensionTime.toString());
      setAutoBidDelay(data.autoBidDelay.toString());
    } catch (error) {
      console.error("Failed to load system configuration", error);
      addAlert("error", "Failed to load system configuration");
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleUpdateClick = (
    field: "window" | "time" | "delay",
    value: number,
    fieldName: string
  ) => {
    if (isNaN(value) || value < 1) {
      addAlert("error", "Please enter a valid number (at least 1)");
      return;
    }

    setPendingUpdate({ field, value, fieldName });
    setIsModalOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingUpdate) return;
    const { field, value } = pendingUpdate;

    let payload = {};
    if (field === "window") {
      setSavingWindow(true);
      payload = { auctionExtensionWindow: value };
    } else if (field === "time") {
      setSavingTime(true);
      payload = { auctionExtensionTime: value };
    } else if (field === "delay") {
      setSavingDelay(true);
      payload = { autoBidDelay: value };
    }

    try {
      const updated = await adminApi.updateSystemConfig(payload);
      setConfig(updated);
      addAlert("success", "Configuration updated successfully");

      if (field === "window")
        setExtensionWindow(updated.auctionExtensionWindow.toString());
      if (field === "time")
        setExtensionTime(updated.auctionExtensionTime.toString());
      if (field === "delay") setAutoBidDelay(updated.autoBidDelay.toString());
    } catch (error) {
      console.error("Failed to update configuration", error);
      addAlert("error", "Failed to update configuration");
    } finally {
      if (field === "window") setSavingWindow(false);
      if (field === "time") setSavingTime(false);
      if (field === "delay") setSavingDelay(false);
      setPendingUpdate(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  if (!config)
    return (
      <div className="text-center p-12 text-red-500">
        Failed to load configuration.
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Settings className="text-gray-700" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            System Configuration
          </h1>
          <p className="text-gray-500 text-sm">Manage global system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Auction Extension Window */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Clock size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Extension Window</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            The time window (in minutes) before an auction ends where new bids
            trigger an extension.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-24">
                Minutes:
              </span>
              <input
                type="number"
                min="1"
                value={extensionWindow}
                onChange={(e) => setExtensionWindow(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              />
              <button
                onClick={() => setExtensionWindow(DEFAULT_WINDOW.toString())}
                className="p-2 text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                title={`Revert to default (${DEFAULT_WINDOW})`}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <button
              onClick={() =>
                handleUpdateClick(
                  "window",
                  parseInt(extensionWindow),
                  "Extension Window"
                )
              }
              disabled={
                savingWindow ||
                config?.auctionExtensionWindow.toString() === extensionWindow
              }
              className="w-full bg-primary-blue text-white py-3 mt-1 rounded-md text-sm font-medium hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {savingWindow ? "Saving..." : "Update Window"}
            </button>
          </div>
        </div>

        {/* Auction Extension Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-emerald-600 rounded-lg">
              <Timer size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Extension Time</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            The amount of time (in minutes) added to the auction end time when a
            bid is placed within the window.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-24">
                Minutes:
              </span>
              <input
                type="number"
                min="1"
                value={extensionTime}
                onChange={(e) => setExtensionTime(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              />
              <button
                onClick={() => setExtensionTime(DEFAULT_TIME.toString())}
                className="p-2 text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                title={`Revert to default (${DEFAULT_TIME})`}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <button
              onClick={() =>
                handleUpdateClick(
                  "time",
                  parseInt(extensionTime),
                  "Extension Time"
                )
              }
              disabled={
                savingTime ||
                config?.auctionExtensionTime.toString() === extensionTime
              }
              className="w-full bg-primary-blue text-white py-3 mt-1 rounded-md text-sm font-medium hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {savingTime ? "Saving..." : "Update Time"}
            </button>
          </div>
        </div>

        {/* Auto Bid Delay */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Gavel size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Auto Bid Delay</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            The delay (in milliseconds) between automatic bids placed by the
            system.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-24">
                Milliseconds:
              </span>
              <input
                type="number"
                min="1"
                value={autoBidDelay}
                onChange={(e) => setAutoBidDelay(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              />
              <button
                onClick={() => setAutoBidDelay(DEFAULT_DELAY.toString())}
                className="p-2 text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                title={`Revert to default (${DEFAULT_DELAY})`}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <button
              onClick={() =>
                handleUpdateClick(
                  "delay",
                  parseInt(autoBidDelay),
                  "Auto Bid Delay"
                )
              }
              disabled={
                savingDelay || config?.autoBidDelay.toString() === autoBidDelay
              }
              className="w-full bg-primary-blue text-white py-3 mt-1 rounded-md text-sm font-medium hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {savingDelay ? "Saving..." : "Update Delay"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmUpdate}
        title="Confirm Update"
        message={`Are you sure you want to update ${pendingUpdate?.fieldName} to ${pendingUpdate?.value}?`}
        confirmText="Update"
        type="info"
      />
    </div>
  );
};

export default AdminSystemConfigContainer;
