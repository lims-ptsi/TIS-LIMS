import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, UserCog, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../brand/LabTisBrand';
import { APP_ROLES, AppRole, roleLabel } from '../../data/roleAccess';
import { LimsHeroHeader } from '../common/LimsHeroHeader';
import { LimsWorkspace } from '../common/LimsWorkspace';

type FormMode = 'create' | 'edit';

interface AccountFormState {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AppRole;
}

const emptyForm = (): AccountFormState => ({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STAFF',
});

export const AccountManagementView: React.FC = () => {
  const {
    user,
    directoryAccounts,
    adminCreateAccount,
    adminUpdateAccount,
    adminDeleteAccount,
  } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...directoryAccounts].sort((a, b) =>
      a.user.name.localeCompare(b.user.name, undefined, { sensitivity: 'base' })
    );
    if (!q) return list;
    return list.filter(
      (row) =>
        row.user.name.toLowerCase().includes(q) ||
        row.user.username.toLowerCase().includes(q) ||
        (row.user.email || '').toLowerCase().includes(q) ||
        row.user.roleType.toLowerCase().includes(q)
    );
  }, [directoryAccounts, search]);

  const openCreate = () => {
    setFormMode('create');
    setEditingUsername(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (username: string) => {
    const row = directoryAccounts.find((item) => item.user.username === username);
    if (!row) return;
    setFormMode('edit');
    setEditingUsername(username);
    setForm({
      name: row.user.name,
      username: row.user.username,
      email: row.user.email || '',
      password: '',
      confirmPassword: '',
      role: row.user.roleType as AppRole,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      if (formMode === 'create') {
        if (form.password !== form.confirmPassword) {
          setFormError('Passwords do not match.');
          return;
        }
        const result = await adminCreateAccount({
          name: form.name,
          username: form.username,
          email: form.email.trim() || undefined,
          password: form.password || undefined,
          role: form.role,
        });
        if (!result.success) {
          setFormError(result.error || 'Could not create account.');
          return;
        }
      } else if (editingUsername) {
        if (form.password && form.password !== form.confirmPassword) {
          setFormError('Passwords do not match.');
          return;
        }
        const result = await adminUpdateAccount({
          username: editingUsername,
          name: form.name,
          newUsername: form.username !== editingUsername ? form.username : undefined,
          email: form.email.trim(),
          password: form.password || undefined,
          role: form.role,
        });
        if (!result.success) {
          setFormError(result.error || 'Could not update account.');
          return;
        }
      }
      closeForm();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const result = await adminDeleteAccount(deleteTarget);
      if (!result.success) {
        setFormError(result.error || 'Could not delete account.');
        return;
      }
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lims-page-shell space-y-4">
      <LimsWorkspace
        header={
          <LimsHeroHeader
            icon={UserCog}
            title="Account management"
            description="Create, update, and remove sign-in accounts for each laboratory desk role. Changes apply on this browser immediately."
            badges={
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-white border border-[var(--lims-border)] px-2 py-0.5 rounded-full">
                  Administration
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0878e8] border border-sky-100">
                  {directoryAccounts.length} accounts
                </span>
              </>
            }
            actions={
              <button
                type="button"
                onClick={openCreate}
                className="lims-btn-primary px-4 py-2 text-sm rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add account</span>
              </button>
            }
          />
        }
        toolbar={
          <div className="p-3 sm:p-4 border-b border-[var(--lims-border)] bg-[#f8fafc]/80">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, username, or role…"
                className="lims-input pl-9 pr-3 py-2 text-xs w-full"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs lims-table">
            <thead>
              <tr>
                <th className="px-5 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Username</th>
                <th className="px-3 py-2.5 font-semibold">Google SSO Email</th>
                <th className="px-3 py-2.5 font-semibold">Desk role</th>
                <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No accounts match this search.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSelf = user?.username === row.user.username;
                  return (
                    <tr key={row.user.id} className={isSelf ? 'bg-sky-50/40' : undefined}>
                      <td className="px-5 py-3 align-middle">
                        <div className="font-medium text-slate-900">{row.user.name}</div>
                        {isSelf ? (
                          <span className="text-[10px] text-[#0878e8] font-semibold mt-0.5">Signed in</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono text-slate-700">{row.user.username}</td>
                      <td className="px-3 py-3 align-middle text-slate-600">
                        {row.user.email && !row.user.email.endsWith('@ptsi.lab') ? (
                          <span className="font-mono text-[11px] text-slate-800">{row.user.email}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not linked</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {roleLabel(row.user.roleType)}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row.user.username)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-[11px] font-semibold hover:border-[#0878e8]/40 hover:text-[#0878e8] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(row.user.username)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-800 text-[11px] font-semibold hover:bg-red-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? 'Sign in with another account to remove this one' : 'Delete account'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LimsWorkspace>

      {formOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-form-title"
            className="lims-card w-full max-w-md shadow-xl"
          >
            <div className="px-5 py-4 border-b border-[var(--lims-border)]">
              <h2 id="account-form-title" className="text-lg font-semibold text-[var(--lims-navy)]">
                {formMode === 'create' ? 'Add account' : 'Update account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {formMode === 'create'
                  ? 'The person signs in with the username and password you set here.'
                  : 'Leave password blank to keep the current password.'}
              </p>
            </div>
            <form onSubmit={submitForm} className="px-5 py-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Full name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="lims-input mt-1"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Username</span>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="lims-input mt-1 font-mono"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  Google SSO email (optional)
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@gmail.com"
                  className="lims-input mt-1"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Desk role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AppRole }))}
                  className="lims-input mt-1"
                >
                  {APP_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  {formMode === 'create'
                    ? form.email.trim()
                      ? 'Password (optional for Google SSO)'
                      : 'Password'
                    : 'New password (optional)'}
                </span>
                <input
                  type="password"
                  required={formMode === 'create' && !form.email.trim()}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="lims-input mt-1"
                  autoComplete={formMode === 'create' ? 'new-password' : 'off'}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Confirm password</span>
                <input
                  type="password"
                  required={(formMode === 'create' && !form.email.trim()) || form.password.length > 0}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="lims-input mt-1"
                  autoComplete="off"
                />
              </label>
              {formError ? (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
              ) : null}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="lims-btn-secondary text-sm px-4 py-2 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="lims-btn-primary text-sm px-4 py-2 rounded-lg">
                  {busy ? 'Saving…' : formMode === 'create' ? 'Create account' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="lims-card w-full max-w-sm shadow-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--lims-navy)]">Delete account?</h2>
            <p className="text-sm text-slate-600">
              <span className="font-mono font-medium text-slate-800">{deleteTarget}</span> will be removed from this
              workstation. They can no longer sign in until an administrator recreates the account.
            </p>
            {formError ? (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setFormError(null);
                }}
                className="lims-btn-secondary text-sm px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                className="text-sm px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};