import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(null);

  useEffect(() => {
    api.get('/config').then((res) => setDemo(res.data.demoAccounts?.find((a) => a.role === 'admin') || null)).catch(() => {});
  }, []);

  const signIn = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data.user.role !== 'admin') {
        setError('Admin access required.');
        return;
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    signIn({ email, password });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '36px', width: 'min(360px, calc(100vw - 32px))', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: '#4A90D9', marginBottom: 24, textAlign: 'center' }}>SteamBlast Admin</h2>
        {error && <div style={{ color: '#e74c3c', marginBottom: 12, fontSize: '0.9rem' }}>{error}</div>}
        <input style={{ ...s.input, width: '100%' }} type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={{ ...s.input, width: '100%' }} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={{ ...s.btn, width: '100%' }}>Sign In</button>
        {demo && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: '#aab' }}>
            <div style={{ marginBottom: 10 }}>Demo: the admin can browse and add questions, but not remove them.</div>
            <button type="button" onClick={() => signIn({ email: demo.email, password: demo.password })} style={{ ...s.btn, width: '100%', background: 'rgba(241,196,15,0.15)', border: '1px solid rgba(241,196,15,0.4)', color: '#f5e6b0' }}>
              Sign in as the demo admin
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', difficulty: '' });
  const [form, setForm] = useState({ subject: 'maths', topic: '', difficulty: 1, questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filter.subject) params.subject = filter.subject;
    if (filter.difficulty) params.difficulty = filter.difficulty;
    const res = await api.get('/questions', { params: { ...params, limit: 200 } });
    setQuestions(res.data.questions);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const setOpt = (i, field, value) => {
    setForm((f) => {
      const opts = [...f.options];
      opts[i] = { ...opts[i], [field]: value };
      if (field === 'isCorrect' && value) {
        opts.forEach((o, idx) => { if (idx !== i) opts[idx] = { ...o, isCorrect: false }; });
      }
      return { ...f, options: opts };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/questions', form);
      setMsg({ type: 'success', text: 'Question created!' });
      setShowForm(false);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setMsg({ type: 'error', text: err.response?.data?.error || (errors ? `Check the ${errors[0].path} field.` : 'Failed.') });
    }
    setSaving(false);
  };

  const deactivate = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((q) => q.filter((qi) => qi.id !== id));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Could not remove that question.' });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ color: '#4A90D9' }}>Question Bank</h2>
        <button onClick={() => setShowForm(!showForm)} style={s.btn}>+ Add Question</button>
      </div>

      {msg && (
        <div role="status" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '12px 18px', borderRadius: 10, background: '#16213e', border: `1px solid ${msg.type === 'success' ? '#2ecc71' : '#e74c3c'}`, color: msg.type === 'success' ? '#2ecc71' : '#ff8a80', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxWidth: 'calc(100vw - 32px)' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} aria-label="Dismiss" style={{ marginLeft: 12, background: 'none', border: 'none', color: '#aab', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 24, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <select style={s.input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              <option value="maths">Maths</option>
              <option value="literacy">Literacy</option>
            </select>
            <input style={s.input} placeholder="Topic (e.g. addition)" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required />
            <select style={s.input} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) })}>
              <option value={1}>Level 1 (Ages 5-7)</option>
              <option value={2}>Level 2 (Ages 7-9)</option>
              <option value={3}>Level 3 (Ages 9-12)</option>
            </select>
          </div>
          <textarea style={{ ...s.input, height: 80, resize: 'vertical', width: '100%', marginBottom: 12 }}
            placeholder="Question text" value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })} required />
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: 8 }}>Options (click ✓ to mark correct)</div>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...s.input, flex: 1 }} placeholder={`Option ${i + 1}`} value={opt.text}
                  onChange={(e) => setOpt(i, 'text', e.target.value)} required />
                <button type="button" onClick={() => setOpt(i, 'isCorrect', true)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: opt.isCorrect ? '#2ecc71' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                  ✓
                </button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} style={s.btn}>{saving ? 'Saving...' : 'Create Question'}</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...s.input, width: 160 }} value={filter.subject} onChange={(e) => setFilter({ ...filter, subject: e.target.value })}>
          <option value="">All Subjects</option>
          <option value="maths">Maths</option>
          <option value="literacy">Literacy</option>
        </select>
        <select style={{ ...s.input, width: 160 }} value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}>
          <option value="">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : (
        <div>
          <div style={{ color: '#888', marginBottom: 12 }}>{questions.length} questions</div>
          {questions.map((q) => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>{q.subject} · {q.topic} · L{q.difficulty}</span>
                  <div style={{ marginTop: 4 }}>{q.questionText}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {q.options.map((opt, i) => (
                      <span key={i} style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6, background: opt.isCorrect ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${opt.isCorrect ? '#2ecc71' : 'rgba(255,255,255,0.1)'}` }}>
                        {opt.text}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => deactivate(q.id)} style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer', marginLeft: 12, flexShrink: 0 }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users?limit=100').then((res) => {
      setUsers(res.data.rows || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ color: '#4A90D9', marginBottom: 24 }}>Users ({users.length})</h2>
      {loading ? <div style={{ color: '#888' }}>Loading...</div> : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px', padding: '8px 12px', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            <span>User</span><span>Email</span><span>Role</span><span>Premium</span><span>Games</span>
          </div>
          {users.map((u) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 4, alignItems: 'center', fontSize: '0.88rem' }}>
              <span style={{ fontWeight: 'bold' }}>{u.displayName}</span>
              <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email || 'Guest'}</span>
              <span style={{ textTransform: 'capitalize', color: u.role === 'admin' ? '#e74c3c' : '#aaa' }}>{u.role}</span>
              <span>{u.isPremium ? '⭐' : '—'}</span>
              <span style={{ color: '#4A90D9' }}>{u.gamesPlayed}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = ['Questions', 'Users'];

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('Questions');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div>
      <div style={{ background: '#16213e', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ color: '#4A90D9', fontWeight: 'bold', fontSize: '1.1rem' }}>💦 SteamBlast Admin</span>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', color: tab === t ? '#4A90D9' : '#888', cursor: 'pointer', fontWeight: tab === t ? 'bold' : 'normal', fontSize: '0.95rem' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Questions' && <QuestionManager />}
      {tab === 'Users' && <UserManager />}
    </div>
  );
}

const s = {
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', marginBottom: 10, display: 'block' },
  btn: { padding: '10px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
};
