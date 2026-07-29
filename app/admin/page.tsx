"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Setting = {
  id: number;
  title: string;
  slot_length: number;
  slot_intervall: number;
  notification_email: string;
  slack_webhook: string | null;
  availability_start: string;
  availability_end: string;
  is_active: boolean;
};

type FormState = Omit<Setting, "id">;

const initialFormState: FormState = {
  title: "",
  slot_length: 30,
  slot_intervall: 30,
  notification_email: "",
  slack_webhook: "",
  availability_start: "",
  availability_end: "",
  is_active: true,
};

export default function AdminPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        setSettings([]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSettings(data);
      setIsLoading(false);
    }

    loadSettings();
  }, []);

  async function refreshSettings() {
    const response = await fetch("/api/settings");
    if (!response.ok) return;
    setSettings(await response.json());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/settings/${editingId}` : "/api/settings";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(result.error || "Failed to save settings.");
      return;
    }

    setMessage(editingId ? "Setting updated." : "Settings saved successfully.");
    setForm(initialFormState);
    setEditingId(null);
    await refreshSettings();
  }

  const handleEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setForm({
      title: setting.title,
      slot_length: setting.slot_length,
      slot_intervall: setting.slot_intervall,
      notification_email: setting.notification_email,
      slack_webhook: setting.slack_webhook ?? "",
      availability_start: setting.availability_start.slice(0, 16),
      availability_end: setting.availability_end.slice(0, 16),
      is_active: setting.is_active,
    });
  };

  const handleDelete = async (setting: Setting) => {
    const action = setting.is_active ? "deactivate" : "delete";
    const confirmed = confirm(`Are you sure you want to ${action} this setting?`);
    if (!confirmed) return;

    if (setting.is_active) {
      const response = await fetch(`/api/settings/${setting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Failed to deactivate setting.");
        return;
      }

      setMessage("Setting deactivated.");
    } else {
      const response = await fetch(`/api/settings/${setting.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        setMessage(result.error || "Failed to delete setting.");
        return;
      }

      setMessage("Setting deleted.");
      if (editingId === setting.id) {
        setEditingId(null);
        setForm(initialFormState);
      }
    }

    await refreshSettings();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Admin settings</h1>
            <p className="mt-2 text-slate-600">Configure the slot rules and notification settings for bookings.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Home
            </Link>
            {editingId ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Editing setting #{editingId}</span> : null}
          </div>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={form.title}
              onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slot length (minutes)</span>
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                value={form.slot_length}
                onChange={(event) => setForm((f) => ({ ...f, slot_length: Number(event.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slot interval (minutes)</span>
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                value={form.slot_intervall}
                onChange={(event) => setForm((f) => ({ ...f, slot_intervall: Number(event.target.value) }))}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notification email</span>
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={form.notification_email}
              onChange={(event) => setForm((f) => ({ ...f, notification_email: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Slack webhook URL (optional)</span>
            <input
              type="url"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={form.slack_webhook}
              onChange={(event) => setForm((f) => ({ ...f, slack_webhook: event.target.value }))}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Availability start</span>
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                value={form.availability_start}
                onChange={(event) => setForm((f) => ({ ...f, availability_start: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Availability end</span>
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                value={form.availability_end}
                onChange={(event) => setForm((f) => ({ ...f, availability_end: event.target.value }))}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((f) => ({ ...f, is_active: event.target.checked }))}
            />
            Active settings
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : editingId ? "Update setting" : "Save settings"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialFormState);
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </form>

        <div className="mt-12 overflow-x-auto">
          <h2 className="text-2xl font-semibold">Existing settings</h2>
          {isLoading ? (
            <p className="mt-4 text-slate-600">Loading settings…</p>
          ) : settings.length === 0 ? (
            <p className="mt-4 text-slate-600">No settings found.</p>
          ) : (
            <table className="mt-4 min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Title</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Slot length</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Interval</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Notification email</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Active</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {settings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="px-4 py-4 text-slate-700">{setting.title}</td>
                    <td className="px-4 py-4 text-slate-700">{setting.slot_length}</td>
                    <td className="px-4 py-4 text-slate-700">{setting.slot_intervall}</td>
                    <td className="px-4 py-4 text-slate-700">{setting.notification_email}</td>
                    <td className="px-4 py-4 text-slate-700">
                      <div
                        role="img"
                        aria-label={setting.is_active ? "Active" : "Inactive"}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full p-1 transition-colors duration-200 ${
                          setting.is_active ? "bg-slate-900" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                            setting.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/settings/${setting.id}/bookings`}
                          className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
                        >
                          Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(setting)}
                          className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(setting)}
                          className={`rounded-2xl px-3 py-2 text-sm font-semibold ${setting.is_active ? "bg-sky-100 text-sky-700 hover:bg-sky-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                        >
                          {setting.is_active ? "Deactivate" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
