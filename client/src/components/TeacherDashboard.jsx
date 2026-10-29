import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const MODE_LABEL = { maths: '🔢 Maths', literacy: '📖 Literacy', mixed: '🎲 Mixed' };
const LEVEL_LABEL = { 1: 'Ages 5-7', 2: 'Ages 7-9', 3: 'Ages 9-12' };

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
    setClassrooms((c) => [...c, { ...res.data.classroom, students: [] }]);
    setNewClassName('');
    setCreating(false);
  };

  if (loading) return <div style={s.container}><div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</div></div>;

  const students = [...(analytics?.students || [])].sort((a, b) => b.accuracy - a.accuracy);
  const answered = students.reduce((n, st) => n + st.totalAnswered, 0);
  const correct = students.reduce((n, st) => n + st.totalCorrect, 0);
  const needsHelp = students.filter((st) => st.totalAnswered > 0 && st.accuracy < 70);

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
          <h2 style={s.title}>👩‍🏫 Teacher Dashboard</h2>
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
              <button key={c.id} style={s.classCard} onClick={() => loadClassroom(c.id)}>
                <div style={s.className}>{c.name}</div>
                <div style={s.classCode}>Code: <strong style={{ color: '#4A90D9', letterSpacing: 1 }}>{c.joinCode}</strong></div>
                <div style={s.classStudents}>
                  {c.students?.length || 0} students · {MODE_LABEL[c.activeMode]} · {LEVEL_LABEL[c.difficulty]}
                </div>
              </button>
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
            <div style={{ color: '#888', marginBottom: 20 }}>
              Join code: <strong style={{ color: '#4A90D9', letterSpacing: 1 }}>{selected.joinCode}</strong>
              {' · '}{MODE_LABEL[selected.activeMode]} · {LEVEL_LABEL[selected.difficulty]}
            </div>

            <div style={s.cards}>
              <div style={s.card}><div style={s.cardValue}>{students.length}</div><div style={s.cardLabel}>Students</div></div>
              <div style={s.card}><div style={s.cardValue}>{analytics?.totalGamesPlayed || 0}</div><div style={s.cardLabel}>Games played</div></div>
              <div style={s.card}><div style={s.cardValue}>{answered}</div><div style={s.cardLabel}>Questions answered</div></div>
              <div style={s.card}>
                <div style={{ ...s.cardValue, color: answered && correct / answered >= 0.7 ? '#2ecc71' : '#f39c12' }}>
                  {answered ? Math.round((correct / answered) * 100) : 0}%
                </div>
                <div style={s.cardLabel}>Class accuracy</div>
              </div>
            </div>

            {needsHelp.length > 0 && (
              <div style={s.notice}>
                💡 {needsHelp.map((st) => st.user?.displayName).join(', ')} {needsHelp.length === 1 ? 'is' : 'are'} below 70% accuracy and may need extra practice.
              </div>
            )}

            <h4 style={s.sectionTitle}>Class Performance</h4>
            {students.length > 0 ? (
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span>Student</span><span style={{ textAlign: 'right' }}>Games</span><span>Accuracy</span><span style={{ textAlign: 'right' }}>Avg score</span>
                </div>
                {students.map((st) => (
                  <div key={st.user?.id} style={s.tableRow}>
                    <span style={{ fontWeight: 'bold' }}>{st.user?.displayName}</span>
                    <span style={{ textAlign: 'right' }}>{st.gamesPlayed}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={s.bar}><span style={{ ...s.barFill, width: `${st.accuracy}%`, background: st.accuracy >= 70 ? '#2ecc71' : '#e67e22' }} /></span>
                      <span style={{ color: st.accuracy >= 70 ? '#2ecc71' : '#e67e22', width: 38 }}>{st.accuracy}%</span>
                    </span>
                    <span style={{ color: '#4A90D9', textAlign: 'right' }}>{st.avgScore.toFixed(1)}</span>
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
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff' },
  panel: { maxWidth: 860, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  title: { color: '#4A90D9', fontSize: '1.5rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  newBtn: { padding: '8px 16px', borderRadius: 8, background: '#2ecc71', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  createBox: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '20px', marginBottom: 24 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  saveBtn: { padding: '8px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer' },
  cancelBtn: { padding: '8px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' },
  classGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  classCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', color: '#fff', font: 'inherit' },
  className: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 6 },
  classCode: { fontSize: '0.85rem', color: '#aaa', marginBottom: 4 },
  classStudents: { fontSize: '0.8rem', color: '#888' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 },
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' },
  cardValue: { fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' },
  cardLabel: { fontSize: '0.78rem', color: '#8d97b5', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  notice: { background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.35)', color: '#f5c28b', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.9rem', lineHeight: 1.5 },
  sectionTitle: { color: '#aaa', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  table: { overflowX: 'auto' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'minmax(110px, 1fr) 60px minmax(140px, 1.2fr) 80px', gap: 12, padding: '8px 12px', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, minWidth: 440 },
  tableRow: { display: 'grid', gridTemplateColumns: 'minmax(110px, 1fr) 60px minmax(140px, 1.2fr) 80px', gap: 12, padding: '12px', borderRadius: 8, alignItems: 'center', background: 'rgba(255,255,255,0.03)', marginBottom: 4, minWidth: 440 },
  bar: { flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 4 },
};
