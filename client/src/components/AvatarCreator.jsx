import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const OPTIONS = {
  headShape: ['Round', 'Square', 'Oval', 'Wide', 'Narrow'],
  hairStyle: ['Short', 'Long', 'Curly', 'Wavy', 'Spiky', 'Bald', 'Braids', 'Ponytail', 'Bob', 'Afro', 'Mohawk', 'Bun', 'Pigtails', 'Fringe', 'Messy'],
  hairColor: ['Black', 'Brown', 'Blonde', 'Red', 'Blue', 'Purple', 'Pink', 'Green', 'Orange', 'White', 'Silver', 'Teal'],
  skinTone: ['Pale', 'Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark', 'Deep', 'Olive'],
  eyes: ['Round', 'Almond', 'Wide', 'Narrow', 'Tired', 'Sparkling', 'Star', 'Heart', 'Angry', 'Cool-Shades'],
  outfit: ['Casual Blue', 'Casual Red', 'Superhero', 'School Uniform', 'Space Suit', 'Ninja', 'Pirate', 'Royalty', 'Sports', 'Wizard'],
  outfitColor: ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Teal', 'Gold', 'Silver'],
};

export default function AvatarCreator() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [avatar, setAvatar] = useState(user?.avatar || {});
  const [saving, setSaving] = useState(false);

  const setOption = (key, value) => setAvatar((a) => ({ ...a, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ avatar });
    setSaving(false);
    navigate('/');
  };

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <h2 style={s.title}>👤 Avatar Creator</h2>

        <div style={s.previewBox}>
          <div style={s.previewAvatar}>
            {/* Placeholder avatar */}
            <div style={{ fontSize: '5rem', textAlign: 'center' }}>🧑</div>
            <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: 8 }}>
              {user?.displayName}
            </div>
          </div>
        </div>

        <div style={s.sections}>
          {Object.entries(OPTIONS).map(([key, opts]) => (
            <div key={key} style={s.section}>
              <div style={s.sectionLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div style={s.optRow}>
                {opts.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setOption(key, opt)}
                    style={s.optBtn(avatar[key] === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={s.btnRow}>
          <button onClick={handleSave} style={s.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : '✅ Save Avatar'}
          </button>
          <button onClick={() => navigate('/')} style={s.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: '20px', color: '#fff', overflowY: 'auto' },
  panel: { maxWidth: 700, margin: '0 auto' },
  title: { textAlign: 'center', color: '#4A90D9', fontSize: '1.8rem', marginBottom: 24 },
  previewBox: { display: 'flex', justifyContent: 'center', marginBottom: 24 },
  previewAvatar: { background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 40px', border: '2px solid rgba(74,144,217,0.3)' },
  sections: { display: 'flex', flexDirection: 'column', gap: 16 },
  section: {},
  sectionLabel: { fontSize: '0.85rem', color: '#888', marginBottom: 8, textTransform: 'capitalize' },
  optRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  optBtn: (active) => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${active ? '#4A90D9' : 'rgba(255,255,255,0.15)'}`,
    background: active ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.15s',
  }),
  btnRow: { display: 'flex', gap: 12, marginTop: 28 },
  saveBtn: { flex: 1, padding: '14px', borderRadius: 12, background: '#4A90D9', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  cancelBtn: { padding: '14px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' },
};
