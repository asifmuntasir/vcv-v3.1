import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Users, Hand, MonitorUp, 
  MoreVertical, Send, ShieldCheck, 
  X, Settings, Play, Square,
  Lock, Unlock, StopCircle
} from 'lucide-react';

// --- Sub-component: Video Tile ---
const MockVideoTile = ({ name, role, isMuted, isCameraOff, isHandRaised }) => (
  <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video shadow-lg group ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all">
    {/* Video Placeholder or Stream */}
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${role === 'teacher' ? 'from-indigo-900 to-slate-900' : 'from-slate-800 to-slate-900'}`}>
      {isCameraOff ? (
        <div className="flex flex-col items-center text-slate-500">
            <VideoOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs uppercase tracking-wider font-bold">Video Off</span>
        </div>
      ) : (
        <span className="text-3xl font-bold text-white/20 select-none">{(name || '?').charAt(0)}</span>
      )}
    </div>

    {/* Overlays */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
    
    <div className="absolute bottom-3 left-3 flex items-center gap-2">
      <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
        <span className="text-white text-xs font-medium truncate max-w-[120px]">{name || 'Unknown'}</span>
        {role === 'teacher' && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
      </div>
    </div>

    <div className="absolute top-3 right-3 flex flex-col gap-2">
      {isHandRaised && <div className="bg-yellow-500/90 p-1.5 rounded-full shadow-lg animate-bounce"><Hand className="w-3.5 h-3.5 text-black" /></div>}
      {isMuted && <div className="bg-red-500/90 p-1.5 rounded-full shadow-lg backdrop-blur-sm"><MicOff className="w-3 h-3 text-white" /></div>}
    </div>
  </div>
);

export default function MeetingRoom({ classData, user, onLeave }) {
  const safeUser = user || { name: 'Guest', role: 'student' };
  const isHost = safeUser.role === 'admin';

  // --- State ---
  const [activeSidebar, setActiveSidebar] = useState('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  
  // Host Control States
  const [screenShareLocked, setScreenShareLocked] = useState(true); // Default locked
  
  // Track last active sidebar for smooth exit animations
  const lastActiveSidebar = useRef(activeSidebar);
  useEffect(() => {
    if (activeSidebar) lastActiveSidebar.current = activeSidebar;
  }, [activeSidebar]);
  const contentSidebar = activeSidebar || lastActiveSidebar.current;

  // Mock Data
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: `Welcome to ${classData?.title || 'Class'}`, time: '10:00 AM', type: 'system' },
  ]);

  const [participants, setParticipants] = useState([
    { id: 1, name: safeUser.name, role: isHost ? 'teacher' : 'student', isMuted: false, isCameraOff: false, isHandRaised: false },
    { id: 2, name: 'Sarah Miller', role: 'student', isMuted: true, isCameraOff: false, isHandRaised: true },
    { id: 3, name: 'James Wilson', role: 'student', isMuted: false, isCameraOff: true, isHandRaised: false },
    { id: 4, name: 'Emily Davis', role: 'student', isMuted: true, isCameraOff: false, isHandRaised: false },
  ]);

  // --- Recording Logic (MediaRecorder API) ---
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // 1. Capture Screen & Audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true
      });

      // 2. Setup Recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // 3. Auto-Download on Stop
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${classData?.title || 'class'}-${new Date().toISOString()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Stop all tracks to clear "sharing" indicator
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Permission denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Handlers ---

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      sender: safeUser.name,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'user'
    }]);
    setMessage('');
  };

  const handleScreenShareToggle = () => {
    if (!isHost && screenShareLocked) {
      alert("Screen sharing is currently disabled by the host.");
      return;
    }
    setIsScreenSharing(!isScreenSharing);
    // In real app: Trigger getDisplayMedia logic here
  };

  // --- Host Control Handlers ---
  const toggleMuteAll = () => {
    setParticipants(prev => prev.map(p => 
      p.role === 'teacher' ? p : { ...p, isMuted: true }
    ));
  };

  const toggleVideoAll = () => {
    setParticipants(prev => prev.map(p => 
      p.role === 'teacher' ? p : { ...p, isCameraOff: true }
    ));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-white tracking-tight">{classData?.title || 'Classroom'}</h2>
            <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-400 font-mono flex items-center gap-2 border border-white/5">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              {isRecording ? 'RECORDING' : 'Live'}
            </div>
          </div>
          {isHost && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300">
               <ShieldCheck className="w-3.5 h-3.5" /> Host Controls Active
             </div>
          )}
        </header>

        {/* Video Grid */}
        <main className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <div className="w-full max-w-7xl">
            {/* Screen Share Placeholder (if active) */}
            {isScreenSharing && (
               <div className="mb-4 bg-slate-800 rounded-xl aspect-video flex items-center justify-center border-2 border-indigo-500 shadow-2xl relative overflow-hidden">
                 <div className="text-center">
                   <MonitorUp className="w-16 h-16 text-indigo-500 mx-auto mb-4 opacity-50" />
                   <p className="text-xl font-bold text-white">You are sharing your screen</p>
                   <p className="text-slate-400">Stop sharing to return to grid view</p>
                 </div>
               </div>
            )}
            
            {/* Participant Grid */}
            <div className={`grid gap-4 transition-all ${isScreenSharing ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {participants.map((p) => (
                <MockVideoTile 
                   key={p.id} 
                   {...p} 
                   // Override local user state with real state
                   isMuted={p.id === 1 ? isMuted : p.isMuted}
                   isCameraOff={p.id === 1 ? isCameraOff : p.isCameraOff}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Footer Controls */}
        <footer className="h-20 bg-slate-900 border-t border-white/5 flex items-center justify-between px-6 z-20">
          
          {/* Audio/Video Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsCameraOff(!isCameraOff)} className={`p-4 rounded-2xl transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            
            {/* Screen Share (Permission Checked) */}
            <button 
              onClick={handleScreenShareToggle}
              disabled={!isHost && screenShareLocked}
              className={`p-4 rounded-2xl transition-all ${
                isScreenSharing ? 'bg-indigo-600 text-white' : 
                (!isHost && screenShareLocked) ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            {/* Recording (Host Only) */}
            {isHost && (
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
              </button>
            )}
            
            <div className="w-px h-10 bg-white/10 mx-2"></div>

            <button onClick={onLeave} className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-transform active:scale-95">
              <PhoneOff className="w-5 h-5" /> 
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
          
          {/* Sidebar Toggles */}
          <div className="flex gap-3">
            <button 
              onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')} 
              className={`p-3 rounded-xl transition-all relative ${activeSidebar === 'participants' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border border-slate-900">
                {participants.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} 
              className={`p-3 rounded-xl transition-all ${activeSidebar === 'chat' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>

      {/* --- Sidebar Panel --- */}
      <div 
        className={`bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-30 transition-all duration-300 ease-in-out ${
          activeSidebar ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="w-80 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900">
            <h3 className="font-bold text-white flex items-center gap-2">
              {contentSidebar === 'chat' ? <MessageSquare className="w-4 h-4 text-indigo-400" /> : <Users className="w-4 h-4 text-indigo-400" />}
              {contentSidebar === 'chat' ? 'Class Chat' : 'Participants'}
            </h3>
            <button onClick={() => setActiveSidebar(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CHAT CONTENT */}
          {contentSidebar === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.type === 'system' ? 'items-center my-2' : 'items-start'}`}>
                    {msg.type === 'system' ? (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{msg.text}</span>
                    ) : (
                      <div className="w-full">
                        <div className="flex justify-between items-baseline mb-1 pl-1">
                            <span className="text-xs font-bold text-indigo-300">{msg.sender}</span>
                            <span className="text-[10px] text-slate-600">{msg.time}</span>
                        </div>
                        <div className="text-sm bg-slate-800 p-3 rounded-xl rounded-tl-none border border-white/5 text-slate-200 shadow-sm">
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 relative bg-slate-900">
                <input 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  className="w-full bg-slate-800 text-white pl-4 pr-10 py-3 rounded-xl text-sm border border-slate-700 focus:border-indigo-500 focus:outline-none placeholder-slate-500" 
                  placeholder="Type a message..." 
                />
                <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            // PARTICIPANTS CONTENT
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Host Controls Panel */}
              {isHost && (
                <div className="p-4 border-b border-white/10 bg-indigo-900/10 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Host Controls</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 flex items-center gap-2"><Lock className="w-3 h-3" /> Screen Share</span>
                    <button 
                      onClick={() => setScreenShareLocked(!screenShareLocked)}
                      className={`text-xs px-2 py-1 rounded font-bold transition-colors ${screenShareLocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                    >
                      {screenShareLocked ? 'LOCKED' : 'OPEN'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={toggleMuteAll} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-white/5 transition-colors">
                      Mute All
                    </button>
                    <button onClick={toggleVideoAll} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-white/5 transition-colors">
                      Stop Videos
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {participants.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.role === 'teacher' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 flex items-center gap-1">
                          {p.name}
                          {p.id === 1 && <span className="text-slate-500 text-[10px]">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{p.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.isHandRaised && <Hand className="w-4 h-4 text-yellow-500 animate-pulse" />}
                      <button className={`p-1.5 rounded ${p.isCameraOff ? 'text-red-400 bg-red-400/10' : 'text-slate-400 hover:text-white'}`}>
                        {p.isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      </button>
                      <button className={`p-1.5 rounded ${p.isMuted ? 'text-red-400 bg-red-400/10' : 'text-slate-400 hover:text-white'}`}>
                        {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}