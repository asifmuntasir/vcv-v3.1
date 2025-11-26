import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Video, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MoreVertical,
  ChevronRight,
  Search,
  Bell,
  Trash2,
  Copy,
  CheckCircle,
  X,
  Globe
} from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  // Safety fallback: Ensure we always have a user object to prevent crashes
  // This handles cases where the user prop might be briefly undefined during state transitions
  const safeUser = user || { name: 'Demo Administrator', role: 'Admin' };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetings, setMeetings] = useState([
    { id: 'cls_101', title: 'Advanced Physics 101', date: '2025-11-26', time: '10:00', duration: '90', participants: 34, status: 'live' },
    { id: 'cls_102', title: 'WebRTC Architecture', date: '2025-11-26', time: '13:00', duration: '60', participants: 12, status: 'upcoming' },
    { id: 'cls_103', title: 'Faculty Staff Sync', date: '2025-11-25', time: '09:00', duration: '45', participants: 8, status: 'completed' },
  ]);

  // Form State
  const [newClass, setNewClass] = useState({ title: '', date: '', time: '', duration: '60' });

  const handleCreateClass = (e) => {
    e.preventDefault();
    const newMeeting = {
      id: `cls_${Math.floor(Math.random() * 10000)}`,
      title: newClass.title,
      date: newClass.date,
      time: newClass.time,
      duration: newClass.duration,
      participants: 0,
      status: 'upcoming'
    };
    setMeetings([newMeeting, ...meetings]);
    setShowCreateModal(false);
    setNewClass({ title: '', date: '', time: '', duration: '60' });
  };

  const deleteMeeting = (id) => {
    setMeetings(meetings.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      
      {/* --- Sidebar Navigation --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full transition-all z-20 shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-slate-950/50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">VCV School</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'classes', icon: Video, label: 'My Classes' },
            { id: 'students', icon: Users, label: 'Students' },
            { id: 'calendar', icon: CalendarIcon, label: 'Schedule' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/30">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-900">
              {(safeUser.name || 'A').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{safeUser.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{safeUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 py-2 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 ml-64 p-8 max-w-[1600px] mx-auto w-full">
        
        {/* Top Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search classes..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Class
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Classes', value: meetings.length, icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Active Students', value: '142', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Hours Taught', value: '28h', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">+12% this week</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Classes List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" /> Upcoming & Recent Classes
            </h3>
            <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">View All</button>
          </div>

          <div className="divide-y divide-slate-100">
            {meetings.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                No classes scheduled yet.
              </div>
            ) : meetings.map((meeting) => (
              <div key={meeting.id} className="p-5 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    {/* Date Box */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(meeting.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(meeting.date).getDate()}</span>
                    </div>
                    
                    {/* Info */}
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{meeting.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {meeting.time} ({meeting.duration} min)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {meeting.participants} Registered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {meeting.status === 'live' && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold animate-pulse mr-2">
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span> LIVE
                      </span>
                    )}
                    
                    {meeting.status === 'upcoming' || meeting.status === 'live' ? (
                      <button className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-slate-200 flex items-center gap-2">
                        Start Class <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">
                        Completed
                      </span>
                    )}

                    <div className="w-px h-8 bg-slate-200 mx-1"></div>

                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Copy Invite Link">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteMeeting(meeting.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- Create Class Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Schedule New Class</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced Calculus II"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={newClass.title}
                  onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={newClass.date}
                    onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={newClass.time}
                    onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (Minutes)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={newClass.duration}
                  onChange={(e) => setNewClass({...newClass, duration: e.target.value})}
                >
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="90">1.5 Hours</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}