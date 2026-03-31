import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AICS_LOGO } from '../constants/logo';
import { T } from '../constants/tokens';
import api from '../api/axios';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [tab,      setTab]      = useState('student');
  const roleMap = { student: 'student', professor: 'instructor' };
  const getRole = () => roleMap[tab];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: username, password });
      const { access_token, user } = res.data;

      if (tab === 'student' && user.role !== 'student') {
        setError('This account is not a student account. Please use the Instructor tab.');
        setLoading(false);
        return;
      }
      if (tab === 'professor' && user.role !== 'professor') {
        setError('This account is not an instructor account. Please use the Student tab.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body">
      {/* Left panel */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-12 py-12 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${T.navy900} 0%, ${T.navy700} 60%, ${T.navy600} 100%)` }}
      >
        {/* Decorative circles */}
        {[
          { style: { top: '-60px', right: '-60px', width: '300px', height: '300px', border: `1px solid ${T.gold400}15` } },
          { style: { bottom: '-40px', right: 'auto', left: 'auto', top: 'auto', insetInlineEnd: '-40px', width: '200px', height: '200px', border: `1px solid ${T.gold400}0c` } },
          { style: { bottom: 'auto', top: '-30px', left: '-30px', width: '150px', height: '150px', border: `1px solid ${T.gold400}10` } },
        ].map((c, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={c.style} />
        ))}

        <div className="text-center max-w-[360px] relative z-[1] animate-fade-up">
          <img
            src={AICS_LOGO}
            alt="AICS Logo"
            className="w-[110px] h-[110px] rounded-full object-cover mx-auto mb-6 block"
            style={{ boxShadow: `0 0 40px ${T.gold400}30, 0 8px 32px rgba(0,0,0,0.4)`, border: '3px solid rgba(255,255,255,0.15)' }}
          />
          <div className="text-[32px] font-extrabold text-white font-display leading-[1.1] mb-3">AICS Portal</div>
          <div className="text-[14px] text-gold-400 font-semibold tracking-[2px] uppercase mb-5">
            Asian Institute of Computer Studies
          </div>
          <div className="text-[13px] text-white/40 leading-[1.7] max-w-[280px] mx-auto">
            AICS Bldg., Commonwealth Ave., Holy Spirit Drive, Brgy Don Antonio Dr, Quezon City.
          </div>

          {/* Feature pills */}
          <div className="flex gap-2 flex-wrap justify-center mt-7">
            {['Grade Tracking', 'Report Cards', 'Class Roster', 'Faculty Tools'].map(f => (
              <span key={f} className="bg-white/[0.06] border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/50 font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-[460px] shrink-0 flex flex-col justify-center px-11 py-12 bg-white shadow-[-8px_0_48px_rgba(10,18,40,0.08)]">
        <div className="animate-[fadeUp_0.5s_0.1s_ease_both]">
          <div className="mb-8">
            <img
              src={AICS_LOGO}
              alt="AICS"
              className="w-[52px] h-[52px] rounded-full object-cover mb-4"
              style={{ boxShadow: '0 4px 16px rgba(27,42,74,0.15)' }}
            />
            <div className="text-[24px] font-extrabold text-navy-900 font-display mb-1.5">Sign In</div>
            <div className="text-[13px] text-gray-400">Choose your role and enter your credentials</div>
          </div>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 mb-7 p-1 bg-gray-100 rounded-[10px]">
            {['student', 'professor'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setUsername(''); setPassword(''); }}
                className="py-[9px] rounded-[7px] border-none font-body text-[13px] cursor-pointer transition-all duration-[180ms]"
                style={{
                  background:  tab === t ? '#fff' : 'transparent',
                  color:       tab === t ? T.navy800 : T.gray400,
                  fontWeight:  tab === t ? 700 : 500,
                  boxShadow:   tab === t ? '0 1px 6px rgba(27,42,74,0.12)' : 'none',
                }}
              >
                {t === 'student' ? 'Student' : 'Instructor'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 rounded-lg px-3.5 py-2.5 text-[12px] text-red-700 mb-[18px] animate-fade-in">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.6px] mb-[7px]">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="student1.bs4ma@example.com"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.6px] mb-[7px]">Password</label>
            <div className="relative">
              <input
                className="input-field pr-11"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handle()}
              />
              <button
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[11px] text-gray-400 font-semibold font-body"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            className="btn-primary w-full justify-center py-3 text-[14px] font-bold rounded-[9px] tracking-[0.3px]"
            onClick={handle}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Demo credentials */}
          <div className="mt-6 p-[14px] bg-navy-50 border border-navy-100 rounded-[10px]">
            <div className="text-[11px] font-bold text-navy-700 mb-[7px] uppercase tracking-[0.5px]">Demo Credentials</div>
            {tab === 'student' ? (
              <div className="text-[12px] text-gray-500 leading-[1.8]">
                Email: <code className="text-navy-600 font-bold bg-navy-100 px-1.5 py-px rounded">student1.bs4ma@example.com</code><br/>
                Password: <code className="text-navy-600 font-bold bg-navy-100 px-1.5 py-px rounded">password123</code>
              </div>
            ) : (
              <div className="text-[12px] text-gray-500 leading-[1.8]">
                Email: <code className="text-navy-600 font-bold bg-navy-100 px-1.5 py-px rounded">professor@example.com</code><br/>
                Password: <code className="text-navy-600 font-bold bg-navy-100 px-1.5 py-px rounded">password123</code>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/admin'}
              className="text-[12px] text-navy-600 hover:text-navy-800 underline"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
