'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'USER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setUsers([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUsers();
    }
  }, [sessionStatus, fetchUsers]);

  const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT', role?: string) => {
    setProcessingId(userId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        await fetchUsers();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Action failed' });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Operation failed' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete account ${user.email}? This action is recommended if suspicious activity is detected.`
      )
    ) {
      return;
    }

    setProcessingId(user.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        await fetchUsers();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Deletion failed' });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to delete user' });
    } finally {
      setProcessingId(null);
    }
  };

  const isAdmin =
    (session?.user as any)?.role === 'ADMIN' ||
    session?.user?.email?.toLowerCase() === 'admin@bob.com';

  if (sessionStatus === 'loading') {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page" style={{ maxWidth: '600px', margin: 'var(--space-12) auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--dark-blue)', marginBottom: 'var(--space-2)' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            Only the system administrator (<strong>admin@bob.com</strong>) has permissions to manage user requests and account approvals.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/overview')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const approvedUsers = users.filter((u) => u.status === 'APPROVED');

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <h1 className="page-title">User Administration & Access Control</h1>
            <span className="badge badge-default" style={{ background: 'var(--dark-blue)', color: 'var(--cream)' }}>
              Admin Portal
            </span>
          </div>
          <p className="page-subtitle">
            Review user registration requests, approve new analyst accounts, and monitor user security.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      {actionMessage && (
        <div
          style={{
            background: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${actionMessage.type === 'success' ? '#16a34a' : 'var(--error)'}`,
            color: actionMessage.type === 'success' ? '#16a34a' : 'var(--error)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Accounts</div>
          <div className="kpi-value">{users.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Registered in system</div>
        </div>
        <div className="kpi-card" style={{ borderColor: pendingUsers.length > 0 ? '#f59e0b' : 'var(--border-default)' }}>
          <div className="kpi-label">Pending Approval</div>
          <div className="kpi-value" style={{ color: pendingUsers.length > 0 ? '#d97706' : 'var(--dark-blue)' }}>
            {pendingUsers.length}
          </div>
          <div style={{ fontSize: '11px', color: pendingUsers.length > 0 ? '#d97706' : 'var(--text-tertiary)', fontWeight: 600 }}>
            {pendingUsers.length > 0 ? 'Action required' : 'All requests processed'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Approved Users</div>
          <div className="kpi-value">{approvedUsers.length}</div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Can sign in securely</div>
        </div>
      </div>

      {/* 1. Pending Approvals Section */}
      <section className="section" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--dark-blue)', margin: 0 }}>
            Pending Registration Requests ({pendingUsers.length})
          </h2>
          {pendingUsers.length > 0 && (
            <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
              Needs Review
            </span>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
              No pending account registrations right now. New requests will appear here for your approval.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.02)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                    <strong style={{ fontSize: 'var(--text-base)', color: 'var(--dark-blue)' }}>{user.name}</strong>
                    <span className="badge badge-outline" style={{ fontSize: '10px' }}>
                      {user.role}
                    </span>
                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px' }}>
                      Pending Approval
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Email: <strong>{user.email}</strong> · Requested:{' '}
                    {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAction(user.id, 'APPROVE', 'ANALYST')}
                    disabled={processingId === user.id}
                    style={{ background: '#15803d', borderColor: '#15803d' }}
                  >
                    ✓ Approve Access
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAction(user.id, 'REJECT')}
                    disabled={processingId === user.id}
                    style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                  >
                    ✕ Reject
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteUser(user)}
                    disabled={processingId === user.id}
                    style={{ color: 'var(--error)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. All Users Directory */}
      <section className="section">
        <div className="section-title">All System Accounts ({users.length})</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>User</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Joined</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMasterAdmin = user.email.toLowerCase() === 'admin@bob.com';
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                        {user.name}
                        {isMasterAdmin && (
                          <span style={{ marginLeft: 6, fontSize: '10px', color: 'var(--text-tertiary)' }}>
                            (Master Admin)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span
                          className="badge"
                          style={{
                            background:
                              user.role === 'ADMIN'
                                ? 'var(--dark-blue)'
                                : user.role === 'ANALYST'
                                ? 'var(--cream-dark)'
                                : 'transparent',
                            color: user.role === 'ADMIN' ? 'var(--cream)' : 'var(--dark-blue)',
                            border: '1px solid var(--border-default)',
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span
                          className="badge"
                          style={{
                            background:
                              user.status === 'APPROVED'
                                ? 'rgba(34, 197, 94, 0.12)'
                                : user.status === 'PENDING'
                                ? '#fef3c7'
                                : 'rgba(239, 68, 68, 0.12)',
                            color:
                              user.status === 'APPROVED'
                                ? '#15803d'
                                : user.status === 'PENDING'
                                ? '#b45309'
                                : '#b91c1c',
                            fontWeight: 600,
                          }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--text-tertiary)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                        {!isMasterAdmin ? (
                          <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                            {user.status !== 'APPROVED' ? (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleAction(user.id, 'APPROVE')}
                                disabled={processingId === user.id}
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleAction(user.id, 'REJECT')}
                                disabled={processingId === user.id}
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={processingId === user.id}
                              style={{ color: 'var(--error)' }}
                              title="Delete account for suspicious activity"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
