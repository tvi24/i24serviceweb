import { PERMISSIONS, PRIORITIES, ROLES, ROLE_PERMISSIONS, SUPPORT_GROUPS, type BusinessCalendar, type EmailAccount, type Priority, type Role, type Service, type SlaPolicy, type User } from '@incident/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';

type Tab = 'org' | 'users' | 'roles' | 'groups' | 'services' | 'sla' | 'email';

export function PlatformAdminPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('org');

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('admin.title')}</h1>
          <p className="muted">{t('admin.subtitle')}</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {(['org', 'users', 'roles', 'groups', 'services', 'sla', 'email'] as Tab[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab${tab === k ? ' is-active' : ''}`} onClick={() => setTab(k)}>
            {t(`admin.tab.${k}` as const)}
          </button>
        ))}
      </div>

      {tab === 'org' && <OrgTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'sla' && <SlaTab />}
      {tab === 'email' && <EmailTab />}
    </section>
  );
}

function StatusChip({ active }: { active: boolean }) {
  const t = useT();
  return <span className={`badge badge--${active ? 'within_target' : 'status'}`}>{active ? t('admin.org.active') : t('admin.org.inactive')}</span>;
}

function OrgTab() {
  const t = useT();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('org.manage');
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['org'], queryFn: () => api.getOrgOverview() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['org'] });

  if (isLoading || !data) return <LoadingSkeleton rows={8} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? t('admin.loadFailed')} />;

  const group = data.organizations.find((o) => o.type === 'group');
  const companies = data.organizations.filter((o) => o.type === 'company');
  const orgName = (id?: string | null) => data.organizations.find((o) => o.id === id)?.name ?? t('common.dash');
  const buLabel = (id: string) => { const b = data.businessUnits.find((x) => x.id === id); return b ? `${b.code} — ${b.name}` : id; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Overview tree */}
      <Card>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('admin.org.orgs')}</h2>
        <ul className="tree">
          {group && (
            <li>
              <strong>{group.name}</strong>{!group.active && <> <StatusChip active={false} /></>}
              <ul>
                {companies.map((c) => {
                  const bus = data.businessUnits.filter((b) => b.orgId === c.id);
                  return (
                    <li key={c.id}>
                      {c.name}{!c.active && <> <StatusChip active={false} /></>}
                      {bus.length > 0 && (
                        <ul>
                          {bus.map((b) => (
                            <li key={b.id}>
                              <span className="chip">{b.code}</span> {b.name}{!b.active && <> <StatusChip active={false} /></>}
                              <ul>
                                {data.departments.filter((d) => d.buId === b.id).map((d) => (
                                  <li key={d.id} className="muted">{d.name}{!d.active && <> <StatusChip active={false} /></>}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          )}
        </ul>
      </Card>

      {/* Organizations CRUD */}
      <OrgSection
        title={t('admin.org.orgs')} canEdit={canEdit}
        columns={[t('admin.org.tableName'), t('admin.org.type'), t('admin.org.parent'), t('admin.org.status')]}
        rows={data.organizations}
        renderView={(o) => [o.name, o.type === 'group' ? t('admin.org.typeGroup') : t('admin.org.typeCompany'), orgName(o.parentId), <StatusChip key="s" active={o.active} />]}
        makeDraft={(o) => ({ name: o.name, type: o.type as string, parentId: o.parentId ?? '', active: o.active })}
        renderEdit={(draft, set) => [
          <input key="n" className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} />,
          <select key="t" className="input" value={draft.type} onChange={(e) => set({ ...draft, type: e.target.value })}><option value="group">{t('admin.org.typeGroup')}</option><option value="company">{t('admin.org.typeCompany')}</option></select>,
          <select key="p" className="input" value={draft.parentId} onChange={(e) => set({ ...draft, parentId: e.target.value })}><option value="">{t('admin.org.none')}</option>{data.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>,
          null,
        ]}
        onSave={(id, draft) => api.updateOrganization(id, { name: draft.name, type: draft.type as 'group' | 'company', parentId: draft.parentId || null }).then(invalidate)}
        onToggle={(o) => api.updateOrganization(o.id, { active: !o.active }).then(invalidate)}
        createFields={{ name: '', type: 'company', parentId: '' }}
        renderCreate={(draft, set) => (
          <>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.name')}</label><input className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>{t('admin.org.type')}</label><select className="input" value={draft.type} onChange={(e) => set({ ...draft, type: e.target.value })}><option value="company">{t('admin.org.typeCompany')}</option><option value="group">{t('admin.org.typeGroup')}</option></select></div>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.parent')}</label><select className="input" value={draft.parentId} onChange={(e) => set({ ...draft, parentId: e.target.value })}><option value="">{t('admin.org.none')}</option>{data.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
          </>
        )}
        canCreate={(d) => !!d.name.trim()}
        onCreate={(d) => api.createOrganization({ name: d.name, type: d.type as 'group' | 'company', parentId: d.parentId || null }).then(invalidate)}
      />

      {/* Business Units CRUD */}
      <OrgSection
        title={t('admin.org.bus')} canEdit={canEdit}
        columns={[t('admin.org.code'), t('admin.org.tableName'), t('admin.org.organization'), t('admin.org.status')]}
        rows={data.businessUnits}
        renderView={(b) => [b.code, b.name, orgName(b.orgId), <StatusChip key="s" active={b.active} />]}
        makeDraft={(b) => ({ code: b.code, name: b.name, orgId: b.orgId, active: b.active })}
        renderEdit={(draft, set) => [
          <input key="c" className="input" value={draft.code} onChange={(e) => set({ ...draft, code: e.target.value })} />,
          <input key="n" className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} />,
          <select key="o" className="input" value={draft.orgId} onChange={(e) => set({ ...draft, orgId: e.target.value })}>{data.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>,
          null,
        ]}
        onSave={(id, draft) => api.updateBusinessUnit(id, { code: draft.code, name: draft.name, orgId: draft.orgId }).then(invalidate)}
        onToggle={(b) => api.updateBusinessUnit(b.id, { active: !b.active }).then(invalidate)}
        createFields={{ orgId: '', code: '', name: '' }}
        renderCreate={(draft, set) => (
          <>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.organization')}</label><select className="input" value={draft.orgId} onChange={(e) => set({ ...draft, orgId: e.target.value })}><option value="">{t('common.dash')}</option>{data.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
            <div className="field" style={{ flex: 1 }}><label>{t('admin.org.code')}</label><input className="input" value={draft.code} onChange={(e) => set({ ...draft, code: e.target.value })} /></div>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.name')}</label><input className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} /></div>
          </>
        )}
        canCreate={(d) => !!d.orgId && !!d.code.trim() && !!d.name.trim()}
        onCreate={(d) => api.createBusinessUnit(d).then(invalidate)}
      />

      {/* Departments CRUD */}
      <OrgSection
        title={t('admin.org.depts')} canEdit={canEdit}
        columns={[t('admin.org.tableName'), t('admin.org.businessUnit'), t('admin.org.status')]}
        rows={data.departments}
        renderView={(d) => [d.name, buLabel(d.buId), <StatusChip key="s" active={d.active} />]}
        makeDraft={(d) => ({ name: d.name, buId: d.buId, active: d.active })}
        renderEdit={(draft, set) => [
          <input key="n" className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} />,
          <select key="b" className="input" value={draft.buId} onChange={(e) => set({ ...draft, buId: e.target.value })}>{data.businessUnits.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</select>,
          null,
        ]}
        onSave={(id, draft) => api.updateDepartment(id, { name: draft.name, buId: draft.buId }).then(invalidate)}
        onToggle={(d) => api.updateDepartment(d.id, { active: !d.active }).then(invalidate)}
        createFields={{ buId: '', name: '' }}
        renderCreate={(draft, set) => (
          <>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.businessUnit')}</label><select className="input" value={draft.buId} onChange={(e) => set({ ...draft, buId: e.target.value })}><option value="">{t('common.dash')}</option>{data.businessUnits.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.name}</option>)}</select></div>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.name')}</label><input className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} /></div>
          </>
        )}
        canCreate={(d) => !!d.buId && !!d.name.trim()}
        onCreate={(d) => api.createDepartment(d).then(invalidate)}
      />

      {/* Locations CRUD */}
      <OrgSection
        title={t('admin.org.locations')} canEdit={canEdit}
        columns={[t('admin.org.tableName'), t('admin.org.timeZone'), t('admin.org.status')]}
        rows={data.locations}
        renderView={(l) => [l.name, l.timeZone, <StatusChip key="s" active={l.active} />]}
        makeDraft={(l) => ({ name: l.name, timeZone: l.timeZone, active: l.active })}
        renderEdit={(draft, set) => [
          <input key="n" className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} />,
          <input key="tz" className="input" value={draft.timeZone} onChange={(e) => set({ ...draft, timeZone: e.target.value })} />,
          null,
        ]}
        onSave={(id, draft) => api.updateLocation(id, { name: draft.name, timeZone: draft.timeZone }).then(invalidate)}
        onToggle={(l) => api.updateLocation(l.id, { active: !l.active }).then(invalidate)}
        createFields={{ name: '', timeZone: 'Asia/Bangkok' }}
        renderCreate={(draft, set) => (
          <>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.tableName')}</label><input className="input" value={draft.name} onChange={(e) => set({ ...draft, name: e.target.value })} /></div>
            <div className="field" style={{ flex: 2 }}><label>{t('admin.org.timeZone')}</label><input className="input" value={draft.timeZone} onChange={(e) => set({ ...draft, timeZone: e.target.value })} /></div>
          </>
        )}
        canCreate={(d) => !!d.name.trim() && !!d.timeZone.trim()}
        onCreate={(d) => api.createLocation(d).then(invalidate)}
      />
    </div>
  );
}

// Generic org entity CRUD section (view table + inline edit + activate/deactivate + create form).
function OrgSection<E extends { id: string; active: boolean }, D extends Record<string, any>, C extends Record<string, any>>(props: {
  title: string;
  canEdit: boolean;
  columns: string[];
  rows: E[];
  renderView: (e: E) => (React.ReactNode)[];
  makeDraft: (e: E) => D;
  renderEdit: (draft: D, set: (d: D) => void) => (React.ReactNode | null)[];
  onSave: (id: string, draft: D) => Promise<unknown>;
  onToggle: (e: E) => Promise<unknown>;
  createFields: C;
  renderCreate: (draft: C, set: (d: C) => void) => React.ReactNode;
  canCreate: (d: C) => boolean;
  onCreate: (d: C) => Promise<unknown>;
}) {
  const t = useT();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<D | null>(null);
  const [create, setCreate] = useState<C>(props.createFields);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true); setErr(null);
    try { await fn(); after?.(); } catch (e) { setErr((e as Error)?.message ?? t('common.failed')); } finally { setBusy(false); }
  }

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{props.title}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{props.columns.map((c) => <th key={c}>{c}</th>)}{props.canEdit && <th>{t('admin.org.tableActions')}</th>}</tr></thead>
          <tbody>
            {props.rows.map((e) => {
              const isEditing = editing === e.id;
              const cells = isEditing && draft ? props.renderEdit(draft, setDraft) : props.renderView(e);
              return (
                <tr key={e.id} style={{ cursor: 'default' }}>
                  {props.columns.map((_, i) => <td key={i}>{cells[i] ?? (i === props.columns.length - 1 ? <StatusChip active={e.active} /> : null)}</td>)}
                  {props.canEdit && (
                    <td>
                      {isEditing ? (
                        <div className="row" style={{ gap: 4 }}>
                          <Button size="sm" disabled={busy} onClick={() => run(() => props.onSave(e.id, draft as D), () => setEditing(null))}>{busy ? t('admin.org.saving') : t('admin.org.save')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>{t('admin.org.cancel')}</Button>
                        </div>
                      ) : (
                        <div className="row" style={{ gap: 4 }}>
                          <Button size="sm" variant="secondary" onClick={() => { setEditing(e.id); setDraft(props.makeDraft(e)); setErr(null); }}>{t('admin.org.edit')}</Button>
                          <Button size="sm" variant={e.active ? 'ghost' : 'secondary'} disabled={busy} onClick={() => run(() => props.onToggle(e))}>{e.active ? t('admin.org.deactivate') : t('admin.org.activate')}</Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {props.canEdit && (
        <div className="row" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
          {props.renderCreate(create, setCreate)}
          <div className="field" style={{ marginBottom: 0 }}>
            <Button disabled={busy || !props.canCreate(create)} onClick={() => run(() => props.onCreate(create), () => setCreate(props.createFields))}>{busy ? t('admin.org.adding') : t('admin.org.add')}</Button>
          </div>
        </div>
      )}
      {err && <p className="muted" style={{ color: 'var(--color-danger)' }}>{err}</p>}
    </Card>
  );
}

function UsersTab() {
  const t = useT();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('user.manage');
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.listUsers() });
  const org = useQuery({ queryKey: ['org'], queryFn: () => api.getOrgOverview() });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ roles: Role[]; buId: string | null; isActive: boolean }>({ roles: [], buId: null, isActive: true });

  const save = useMutation({
    mutationFn: (vars: { id: string; patch: Partial<User> }) => api.adminUpdateUser(vars.id, vars.patch),
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  if (users.isLoading || org.isLoading || !users.data || !org.data) return <LoadingSkeleton rows={6} />;
  if (users.isError) return <ErrorState message={(users.error as Error)?.message ?? t('admin.loadFailed')} />;

  const buName = (id?: string | null) => org.data!.businessUnits.find((b) => b.id === id)?.code ?? t('common.dash');

  function beginEdit(u: User) {
    setEditing(u.id);
    setDraft({ roles: [...u.roles], buId: u.buId ?? null, isActive: u.isActive });
  }
  function toggleRole(r: Role) {
    setDraft((d) => ({ ...d, roles: d.roles.includes(r) ? d.roles.filter((x) => x !== r) : [...d.roles, r] }));
  }

  return (
    <Card>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>{t('admin.users.user')}</th><th>{t('admin.users.roles')}</th><th>{t('admin.users.bu')}</th><th>{t('admin.users.active')}</th>{canEdit && <th></th>}</tr>
          </thead>
          <tbody>
            {users.data.map((u) => {
              const isEditing = editing === u.id;
              return (
                <tr key={u.id} style={{ cursor: 'default' }}>
                  <td><strong>{u.displayName}</strong><br /><span className="muted">{u.username}</span></td>
                  <td>
                    {isEditing ? (
                      <div className="row" style={{ gap: 4 }}>
                        {ROLES.map((r) => (
                          <label key={r} className="chip" style={{ cursor: 'pointer' }}>
                            <input type="checkbox" checked={draft.roles.includes(r)} onChange={() => toggleRole(r)} /> {t(`role.${r}`)}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="row" style={{ gap: 4 }}>{u.roles.map((r) => <span key={r} className="chip">{t(`role.${r}`)}</span>)}</div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select className="input" value={draft.buId ?? ''} onChange={(e) => setDraft({ ...draft, buId: e.target.value || null })} style={{ maxWidth: 160 }}>
                        <option value="">{t('common.dash')}</option>
                        {org.data!.businessUnits.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}
                      </select>
                    ) : buName(u.buId)}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} aria-label={t('admin.users.active')} />
                    ) : (
                      <span className={`badge badge--${u.isActive ? 'within_target' : 'status'}`}>{u.isActive ? '✓' : '—'}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      {isEditing ? (
                        <div className="row" style={{ gap: 4 }}>
                          <Button size="sm" disabled={save.isPending || draft.roles.length === 0} onClick={() => save.mutate({ id: u.id, patch: { roles: draft.roles, buId: draft.buId, isActive: draft.isActive } })}>{save.isPending ? t('admin.users.saving') : t('admin.users.save')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>{t('admin.users.cancel')}</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => beginEdit(u)}>{t('admin.users.edit')}</Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {save.isError && <p className="muted" style={{ color: 'var(--color-danger)' }}>{(save.error as Error)?.message}</p>}
    </Card>
  );
}

function RolesTab() {
  const t = useT();
  return (
    <Card>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t('admin.roles.role')}</th><th>{t('admin.roles.permissions')}</th></tr></thead>
          <tbody>
            {ROLES.map((r) => (
              <tr key={r} style={{ cursor: 'default' }}>
                <td><strong>{t(`role.${r}`)}</strong></td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    {ROLE_PERMISSIONS[r].map((p) => <span key={p} className="chip" title={PERMISSIONS[p]}>{p}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EmailTab() {
  const t = useT();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('email.manage');
  const accounts = useQuery({ queryKey: ['email-accounts'], queryFn: () => api.getEmailAccounts() });
  const [testTo, setTestTo] = useState('emma@mgc.demo');
  const [sim, setSim] = useState({ from: 'emma@mgc.demo', subject: 'Cannot connect to VPN', body: 'My VPN keeps dropping since this morning.' });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['email-accounts'] });

  async function run(fn: () => Promise<unknown>, ok?: (r: unknown) => void) {
    setBusy(true); setMsg(null);
    try { const r = await fn(); invalidate(); ok?.(r); } catch (e) { setMsg((e as Error)?.message ?? t('common.failed')); } finally { setBusy(false); }
  }

  if (accounts.isLoading || !accounts.data) return <LoadingSkeleton rows={4} />;
  if (accounts.isError) return <ErrorState message={(accounts.error as Error)?.message ?? t('admin.loadFailed')} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Card>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('email.accountsTitle')}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t('admin.org.tableName')}</th><th>{t('email.address')}</th><th>{t('email.provider')}</th><th>{t('email.status')}</th><th>{t('email.lastInbound')}</th>{canManage && <th></th>}</tr></thead>
            <tbody>
              {accounts.data.map((a: EmailAccount) => (
                <tr key={a.id} style={{ cursor: 'default' }}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.address}</td>
                  <td><span className="chip">{a.provider}</span></td>
                  <td><span className={`badge badge--${a.status === 'connected' ? 'within_target' : a.status === 'error' ? 'breached' : 'status'}`}>{a.status}</span></td>
                  <td className="muted">{a.lastInboundAt ? new Date(a.lastInboundAt).toLocaleString() : t('common.dash')}</td>
                  {canManage && (
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.testEmailConnection(a.id), (r) => setMsg(t('email.tested', { status: (r as { status: string }).status })))}>{t('email.test')}</Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => api.sendTestEmail(a.id, testTo), () => setMsg(t('email.sent')))}>{t('email.sendTest')}</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canManage && (
          <div className="field" style={{ marginTop: 'var(--space-3)', maxWidth: 320 }}>
            <label>{t('email.testTo')}</label>
            <input className="input" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
        )}
      </Card>

      <Card>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('email.inboundTitle')}</h2>
        <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{t('email.inboundHint')}</p>
        <div className="field"><label>{t('email.from')}</label><input className="input" value={sim.from} onChange={(e) => setSim({ ...sim, from: e.target.value })} /></div>
        <div className="field"><label>{t('email.subject')}</label><input className="input" value={sim.subject} onChange={(e) => setSim({ ...sim, subject: e.target.value })} /></div>
        <div className="field"><label>{t('email.body')}</label><textarea className="textarea" value={sim.body} onChange={(e) => setSim({ ...sim, body: e.target.value })} /></div>
        <Button disabled={busy || !sim.from.trim()} onClick={() => run(() => api.ingestInboundEmail(sim), (r) => { const res = r as { action: string; ticketId: string }; setMsg(res.action === 'created' ? t('email.simCreated', { ticketId: res.ticketId }) : t('email.simLinked', { ticketId: res.ticketId })); })}>{busy ? t('admin.org.adding') : t('email.simulate')}</Button>
      </Card>
      {msg && <p className="badge badge--within_target" style={{ alignSelf: 'flex-start' }}>{msg}</p>}
    </div>
  );
}

function ServicesTab() {
  const t = useT();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('service.manage');
  const services = useQuery({ queryKey: ['services'], queryFn: () => api.getServices() });
  const org = useQuery({ queryKey: ['org'], queryFn: () => api.getOrgOverview() });
  const [draft, setDraft] = useState<{ name: string; ownerBuId: string }>({ name: '', ownerBuId: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['services'] });

  if (services.isLoading || !services.data) return <LoadingSkeleton rows={5} />;
  if (services.isError) return <ErrorState message={(services.error as Error)?.message ?? t('admin.loadFailed')} />;
  const buCode = (id?: string | null) => org.data?.businessUnits.find((b) => b.id === id)?.code ?? t('common.dash');

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true); setErr(null);
    try { await fn(); invalidate(); after?.(); } catch (e) { setErr((e as Error)?.message ?? t('common.failed')); } finally { setBusy(false); }
  }

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('admin.services.title')}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t('admin.services.name')}</th><th>{t('admin.services.owner')}</th><th>{t('admin.org.status')}</th>{canEdit && <th></th>}</tr></thead>
          <tbody>
            {services.data.map((s: Service) => (
              <tr key={s.id} style={{ cursor: 'default' }}>
                <td><strong>{s.name}</strong></td>
                <td>{buCode(s.ownerBuId)}</td>
                <td><StatusChip active={s.active} /></td>
                {canEdit && <td><Button size="sm" variant={s.active ? 'ghost' : 'secondary'} disabled={busy} onClick={() => run(() => api.updateService(s.id, { active: !s.active }))}>{s.active ? t('admin.org.deactivate') : t('admin.org.activate')}</Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <div className="row" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 2, marginBottom: 0 }}><label>{t('admin.services.name')}</label><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.services.owner')}</label><select className="input" value={draft.ownerBuId} onChange={(e) => setDraft({ ...draft, ownerBuId: e.target.value })}><option value="">{t('common.dash')}</option>{org.data?.businessUnits.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0 }}><Button disabled={busy || !draft.name.trim()} onClick={() => run(() => api.createService({ name: draft.name, ownerBuId: draft.ownerBuId || null }), () => setDraft({ name: '', ownerBuId: '' }))}>{busy ? t('admin.org.adding') : t('admin.org.add')}</Button></div>
        </div>
      )}
      {err && <p className="muted" style={{ color: 'var(--color-danger)' }}>{err}</p>}
    </Card>
  );
}

function SlaTab() {
  const t = useT();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sla.manage');
  const engine = useQuery({ queryKey: ['sla-engine'], queryFn: () => api.getSlaEngine() });
  const org = useQuery({ queryKey: ['org'], queryFn: () => api.getOrgOverview() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sla-engine'] });

  const [pol, setPol] = useState<{ name: string; priority: string; buId: string; responseTargetMin: string; resolutionMin: string; calendarId: string }>({ name: '', priority: '', buId: '', responseTargetMin: '60', resolutionMin: '480', calendarId: '' });
  const [cal, setCal] = useState<{ name: string; timeZone: string; mode: string }>({ name: '', timeZone: 'Asia/Bangkok', mode: '24x7' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (engine.isLoading || !engine.data) return <LoadingSkeleton rows={6} />;
  if (engine.isError) return <ErrorState message={(engine.error as Error)?.message ?? t('admin.loadFailed')} />;

  const buCode = (id?: string | null) => org.data?.businessUnits.find((b) => b.id === id)?.code ?? t('admin.sla.anyBu');
  const calName = (id?: string | null) => engine.data!.calendars.find((c) => c.id === id)?.name ?? t('admin.sla.noCalendar');

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true); setErr(null);
    try { await fn(); invalidate(); after?.(); } catch (e) { setErr((e as Error)?.message ?? t('common.failed')); } finally { setBusy(false); }
  }

  const resLabel = (p: SlaPolicy) => (p.resolutionMin != null ? `${p.resolutionMin}m` : p.resolutionBd != null ? `${p.resolutionBd}bd` : t('common.dash'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Card>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('admin.sla.policies')}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t('admin.org.tableName')}</th><th>{t('admin.sla.priority')}</th><th>{t('admin.org.businessUnit')}</th><th>{t('admin.sla.responseMin')}</th><th>{t('admin.sla.calendar')}</th><th>{t('admin.org.status')}</th>{canEdit && <th></th>}</tr></thead>
            <tbody>
              {engine.data.policies.map((p) => (
                <tr key={p.id} style={{ cursor: 'default' }}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.priority ?? <span className="muted">{t('admin.sla.anyPriority')}</span>}</td>
                  <td>{buCode(p.buId)}</td>
                  <td>{p.responseTargetMin}m / {resLabel(p)}</td>
                  <td>{calName(p.calendarId)}</td>
                  <td><StatusChip active={p.active} /></td>
                  {canEdit && <td><Button size="sm" variant={p.active ? 'ghost' : 'secondary'} disabled={busy} onClick={() => run(() => api.updateSlaPolicy(p.id, { active: !p.active }))}>{p.active ? t('admin.org.deactivate') : t('admin.org.activate')}</Button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEdit && (
          <div className="row" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}><label>{t('admin.org.tableName')}</label><input className="input" value={pol.name} onChange={(e) => setPol({ ...pol, name: e.target.value })} /></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.priority')}</label><select className="input" value={pol.priority} onChange={(e) => setPol({ ...pol, priority: e.target.value })}><option value="">{t('admin.sla.anyPriority')}</option>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.org.businessUnit')}</label><select className="input" value={pol.buId} onChange={(e) => setPol({ ...pol, buId: e.target.value })}><option value="">{t('admin.sla.anyBu')}</option>{org.data?.businessUnits.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</select></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.responseMin')}</label><input className="input" type="number" min={1} value={pol.responseTargetMin} onChange={(e) => setPol({ ...pol, responseTargetMin: e.target.value })} /></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.resolutionMin')}</label><input className="input" type="number" min={1} value={pol.resolutionMin} onChange={(e) => setPol({ ...pol, resolutionMin: e.target.value })} /></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.calendar')}</label><select className="input" value={pol.calendarId} onChange={(e) => setPol({ ...pol, calendarId: e.target.value })}><option value="">{t('admin.sla.noCalendar')}</option>{engine.data.calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="field" style={{ marginBottom: 0 }}><Button disabled={busy || !pol.name.trim()} onClick={() => run(() => api.createSlaPolicy({ name: pol.name, priority: (pol.priority || null) as Priority | null, buId: pol.buId || null, responseTargetMin: Number(pol.responseTargetMin), resolutionMin: Number(pol.resolutionMin), calendarId: pol.calendarId || null }), () => setPol({ name: '', priority: '', buId: '', responseTargetMin: '60', resolutionMin: '480', calendarId: '' }))}>{busy ? t('admin.org.adding') : t('admin.org.add')}</Button></div>
          </div>
        )}
      </Card>

      <Card>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('admin.sla.calendars')}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t('admin.org.tableName')}</th><th>{t('admin.sla.mode')}</th><th>{t('admin.sla.timeZone')}</th><th>{t('admin.org.status')}</th>{canEdit && <th></th>}</tr></thead>
            <tbody>
              {engine.data.calendars.map((c: BusinessCalendar) => (
                <tr key={c.id} style={{ cursor: 'default' }}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.mode === '24x7' ? t('admin.sla.mode24x7') : `${t('admin.sla.modeBh')} ${c.workStart}–${c.workEnd}`}</td>
                  <td>{c.timeZone}</td>
                  <td><StatusChip active={c.active} /></td>
                  {canEdit && <td><Button size="sm" variant={c.active ? 'ghost' : 'secondary'} disabled={busy} onClick={() => run(() => api.updateBusinessCalendar(c.id, { active: !c.active }))}>{c.active ? t('admin.org.deactivate') : t('admin.org.activate')}</Button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEdit && (
          <div className="row" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}><label>{t('admin.org.tableName')}</label><input className="input" value={cal.name} onChange={(e) => setCal({ ...cal, name: e.target.value })} /></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.mode')}</label><select className="input" value={cal.mode} onChange={(e) => setCal({ ...cal, mode: e.target.value })}><option value="24x7">{t('admin.sla.mode24x7')}</option><option value="business_hours">{t('admin.sla.modeBh')}</option></select></div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>{t('admin.sla.timeZone')}</label><input className="input" value={cal.timeZone} onChange={(e) => setCal({ ...cal, timeZone: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 0 }}><Button disabled={busy || !cal.name.trim()} onClick={() => run(() => api.createBusinessCalendar({ name: cal.name, timeZone: cal.timeZone, mode: cal.mode as '24x7' | 'business_hours' }), () => setCal({ name: '', timeZone: 'Asia/Bangkok', mode: '24x7' }))}>{busy ? t('admin.org.adding') : t('admin.org.add')}</Button></div>
          </div>
        )}
      </Card>
      {err && <p className="muted" style={{ color: 'var(--color-danger)' }}>{err}</p>}
    </div>
  );
}

function GroupsTab() {
  const t = useT();
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.listUsers() });
  if (users.isLoading || !users.data) return <LoadingSkeleton rows={4} />;
  if (users.isError) return <ErrorState message={(users.error as Error)?.message ?? t('admin.loadFailed')} />;
  return (
    <Card>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t('admin.groups.group')}</th><th>{t('admin.groups.members')}</th></tr></thead>
          <tbody>
            {SUPPORT_GROUPS.map((g) => {
              const members = users.data!.filter((u) => u.supportGroup === g);
              return (
                <tr key={g} style={{ cursor: 'default' }}>
                  <td><strong>{t(`group.${g}`)}</strong></td>
                  <td>
                    {members.length === 0 ? <span className="muted">{t('admin.groups.noMembers')}</span> : (
                      <div className="row" style={{ gap: 4 }}>{members.map((m) => <span key={m.id} className="chip">{m.displayName}</span>)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
