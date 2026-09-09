import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { KEYS, storage } from "@/services/storage";
import {
  EmptyState,
  FormModal,
  PageHeader,
  Panel,
  SelectField,
  TextField,
  useConfirm,
} from "@/components/common/Ui";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Badge } from "@/modules/shared";

const ROLES = ["Admin", "Teacher", "Accountant", "Staff"];

export function SchoolProfile() {
  const { settings, saveSettings } = useApp();
  const [form, setForm] = useState<Record<string, any>>(settings);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setForm(settings), [settings]);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickLogo = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!String(form.name || "").trim()) return toast.error("School name is required");
    saveSettings(form);
    toast.success("School profile saved — all documents now use these details");
  };

  return (
    <div>
      <PageHeader
        title="School Profile"
        subtitle="These details appear on every receipt, marksheet, certificate and ID card."
        actions={
          <>
            <Button variant="outline" onClick={() => setForm(settings)}>
              <RotateCcw className="size-4" /> Reset
            </Button>
            <Button onClick={save}>
              <Save className="size-4" /> Save Changes
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="School Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="School Name" value={form.name} onChange={set("name")} required />
              <TextField label="Tagline" value={form.tagline} onChange={set("tagline")} />
              <TextField label="Phone" value={form.phone} onChange={set("phone")} />
              <TextField label="Email" value={form.email} onChange={set("email")} />
              <TextField label="Website" value={form.website} onChange={set("website")} />
              <TextField label="Affiliation" value={form.affiliation} onChange={set("affiliation")} />
              <TextField label="School Code" value={form.code} onChange={set("code")} />
              <TextField label="Principal Name" value={form.principal} onChange={set("principal")} />
              <TextField label="Academic Session" value={form.session} onChange={set("session")} />
              <div className="sm:col-span-2">
                <TextField label="Address" value={form.address} onChange={set("address")} />
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="School Logo">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
              {form.logo ? (
                <img src={form.logo} alt="School logo" className="size-full object-contain" />
              ) : (
                <span className="px-2 text-center text-xs text-muted-foreground">No logo uploaded</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickLogo(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Upload
              </Button>
              <Button
                variant="ghost"
                onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                disabled={!form.logo}
              >
                Remove
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              A square PNG works best. Remember to save changes.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const EMPTY_USER = { name: "", username: "", email: "", password: "", role: "Admin" };

export function UserManagement() {
  const { users, add, update, remove, user } = useApp();
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>(EMPTY_USER);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const startAdd = () => {
    setEditing(null);
    setForm(EMPTY_USER);
    setOpen(true);
  };

  const startEdit = (row: any) => {
    setEditing(row);
    setForm(row);
    setOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim() || !form.username?.trim() || !form.password?.trim())
      return toast.error("Name, username and password are required");
    const clash = users.find(
      (u: any) => u.username === form.username.trim() && u.id !== editing?.id,
    );
    if (clash) return toast.error("That username is already taken");
    if (editing) {
      update("users", editing.id, form);
      toast.success("User updated");
    } else {
      add("users", form, "usr");
      toast.success("User created — they can log in immediately");
    }
    setOpen(false);
  };

  const columns: Column[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "username", label: "Username", sortable: true },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (r) => <Badge tone="blue">{r.role}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              r.id === user?.id
                ? toast.error("You cannot delete the account you are signed in with")
                : confirm(`Delete the login for ${r.name}?`, () => {
                    remove("users", r.id);
                    toast.success("User deleted");
                  })
            }
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create logins and control which role each person signs in with."
        actions={
          <Button onClick={startAdd}>
            <Plus className="size-4" /> Add User
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={users}
        searchKeys={["name", "username", "email", "role"]}
        exportName="users"
        emptyMessage="No users yet."
      />
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit User" : "Add User"}
        onSubmit={submit}
        submitLabel={editing ? "Update" : "Create"}
      >
        <TextField label="Full Name" value={form.name} onChange={set("name")} required />
        <TextField label="Username" value={form.username} onChange={set("username")} required />
        <TextField label="Email" value={form.email} onChange={set("email")} />
        <TextField label="Password" value={form.password} onChange={set("password")} required />
        <SelectField label="Role" value={form.role} onChange={set("role")} options={ROLES} />
      </FormModal>
      {dialog}
    </div>
  );
}

export function BackupRestore() {
  const { resetDemoData, students, teachers, staff, invoices, payments } = useApp();
  const { confirm, dialog } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const payload = JSON.stringify(storage.exportAll(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup file downloaded");
  };

  const importBackup = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (typeof data !== "object" || !data) throw new Error("bad");
        storage.importAll(data);
        storage.set(KEYS.seeded, true);
        toast.success("Backup restored — reloading");
        setTimeout(() => window.location.reload(), 600);
      } catch {
        toast.error("That file is not a valid backup");
      }
    };
    reader.readAsText(file);
  };

  const stats = [
    { label: "Students", value: students.length },
    { label: "Teachers", value: teachers.length },
    { label: "Staff", value: staff.length },
    { label: "Fee Invoices", value: invoices.length },
    { label: "Payments", value: payments.length },
  ];

  return (
    <div>
      <PageHeader
        title="Backup & Restore"
        subtitle="Save a copy of all records to a file, restore from a file, or reload the demo data."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Stored Records">
          {students.length ? (
            <ul className="divide-y divide-border">
              {stats.map((s) => (
                <li key={s.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No records stored yet." />
          )}
        </Panel>

        <Panel title="Actions">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Download backup</p>
                <p className="text-xs text-muted-foreground">Exports every record as a JSON file.</p>
              </div>
              <Button onClick={exportBackup}>
                <Download className="size-4" /> Export
              </Button>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Restore backup</p>
                <p className="text-xs text-muted-foreground">Replaces current records with the file contents.</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => importBackup(e.target.files?.[0])}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Import
              </Button>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Reload demo data</p>
                <p className="text-xs text-muted-foreground">Discards changes and restores the sample school.</p>
              </div>
              <Button
                variant="destructive"
                onClick={() =>
                  confirm("This replaces all current records with the original demo data. Continue?", () => {
                    resetDemoData();
                    toast.success("Demo data restored");
                  })
                }
              >
                <RotateCcw className="size-4" /> Reset
              </Button>
            </div>
          </div>
        </Panel>
      </div>
      {dialog}
    </div>
  );
}
