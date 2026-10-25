import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/classrooms').then((res) => {
      setClassrooms(res.data.classrooms);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadClassroom = async (id) => {
    const res = await api.get(`/teacher/classrooms/${id}`);
    setSelected(res.data.classroom);
    setAnalytics(res.data.analytics);
  };

  const createClassroom = async () => {
    if (!newClassName.trim()) return;
    const res = await api.post('/teacher/classrooms', { name: newClassName });
    setClassrooms((c) => [...c, res.data.classroom]);
    setNewClassName('');
    setCreating(false);
  };

  if (loading) return <div style={s.container}><div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</div></div>;

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
          <h2 style={s.title}>👨‍🏫 Teacher Dashboard</h2>
          <button onClick={() => setCreating(true)} style={s.newBtn}>+ New Class</button>
        </div>

        {creating && (
          <div style={s.createBox}>
            <input style={s.input} placeholder="Class name (e.g. Year 4 Maths)" value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={createClassroom} style={s.saveBtn}>Create</button>
              <button onClick={() => setCreating(false)} style={s.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}

        {!selected ? (
          <div style={s.classGrid}>
            {classrooms.map((c) => (
              <div key={c.id} style={s.classCard} onClick={() => loadClassroom(c.id)}>
                <div style={s.className}>{c.name}</div>
                <div style={s.classCode}>Code: <strong>{c.joinCode}</strong></div>
                <div style={s.classStudents}>{c.students?.length || 0} students</div>
              </div>
            ))}
            {classrooms.length === 0 && (
              <div style={{ color: '#888', textAlign: 'center', gridColumn: '1/-1', padding: 20 }}>
                No classes yet. Create your first class!
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => { setSelected(null); setAnalytics(null); }} style={s.backBtn}>
              ← All Classes
            </button>
            <h3 style={{ color: '#fff', marginBottom: 4, marginTop: 12 }}>{selected.name}</h3>
            <div style={{ color: '#888', marginBottom: 20 }}>Join code: <strong style={{ color: '#4A90D9' }}>{selected.joinCode}</strong></div>

            <h4 style={s.sectionTitle}>Class Performance</h4>
            {analytics?.students?.length > 0 ? (
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span>Student</span><span>Games</span><span>Accuracy</span><span>Avg Score</span>
                </div>
                {analytics.students.map((st) => (
                  <div key={st.user?.id} style={s.tableRow}>
                    <span>{st.user?.displayName}</span>
                    <span>{st.gamesPlayed}</span>
                    <span style={{ color: st.accuracy >= 70 ? '#2ecc71' : '#e74c3c' }}>{st.accuracy}%</span>
                    <span style={{ color: '#4A90D9' }}>{st.avgScore.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#888' }}>No game data yet. Share the code with students!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff', overflowY: 'auto' },
  panel: { maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#4A90D9', fontSize: '1.5rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  newBtn: { padding: '8px 16px', borderRadius: 8, background: '#2ecc71', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  createBox: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '20px', marginBottom: 24 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  saveBtn: { padding: '8px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer' },
  cancelBtn: { padding: '8px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' },
  classGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  classCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all 0.2s' },
  className: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 6 },
  classCode: { fontSize: '0.85rem', color: '#aaa', marginBottom: 4 },
  classStudents: { fontSize: '0.8rem', color: '#888' },
  sectionTitle: { color: '#aaa', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  table: {},
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px', padding: '8px 12px', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px', padding: '12px', borderRadius: 8, alignItems: 'center', background: 'rgba(255,255,255,0.03)', marginBottom: 4 },
};
