import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Users, Hand, MonitorUp, 
  MoreVertical, Send, ShieldCheck, 
  X, Settings, Play, Square,
  Lock, Unlock, StopCircle
} from 'lucide-react';

import { socketService } from '../services/socketService';

// ==========================================
// 2. HELPER COMPONENT: REAL VIDEO PLAYER
// ==========================================
const VideoPlayer = ({ stream, isLocal, name, isMuted }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-white/10">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted} 
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="flex flex-col items-center gap-2">
             <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {(name || '?').charAt(0).toUpperCase()}
             </div>
             <p className="text-sm font-medium text-slate-400">Video Paused</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10 shadow-sm">
        {name} {isLocal && '(You)'}
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function MeetingRoom({ classData, user, onLeave }) {
  const safeUser = user || { name: 'Guest', role: 'student' };
  const isHost = safeUser.role === 'admin';

  // State
  const [activeSidebar, setActiveSidebar] = useState('chat');
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState(new Map()); 
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [screenShareLocked, setScreenShareLocked] = useState(true);
  
  // Chat
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // --- CONNECT TO BACKEND ---
  useEffect(() => {
    const initConference = async () => {
      try {
        // 1. Connect
        await socketService.connect('http://localhost:4000');
        
        // 2. Join
        await socketService.joinRoom(classData?.id || 'default-room', safeUser.name, safeUser.role);
        
        // 3. Get Camera (Try/Catch for environments without camera)
        try {
            // Note: In preview environment, this might fail or show mock stream
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            // 4. Send Stream
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            if (videoTrack) socketService.produce(videoTrack);
            if (audioTrack) socketService.produce(audioTrack);
        } catch (e) {
            console.warn("Camera access denied or unavailable in this environment");
        }

        // 5. Receive Others
        socketService.socket.emit('getProducers', async (producerIds) => {
          if (producerIds && Array.isArray(producerIds)) {
            for (const id of producerIds) {
              await consumeRemoteStream(id);
            }
          }
        });

        if (socketService.socket.on) {
            socketService.socket.on('newProducer', async ({ producerId }) => {
            await consumeRemoteStream(producerId);
            });
        }

      } catch (err) {
        console.error("Join Error:", err);
      }
    };

    initConference();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); 

  const consumeRemoteStream = async (producerId) => {
    const consumer = await socketService.consume(producerId);
    if (!consumer) return;

    // In mock mode, track might be null, handle gracefully
    const stream = consumer.track ? new MediaStream([consumer.track]) : null;

    setRemotePeers(prev => {
      const newMap = new Map(prev);
      newMap.set(consumer.id, { 
        id: consumer.id, 
        name: `User ${consumer.id.substring(0,4)}`, 
        stream: stream 
      });
      return newMap;
    });
  };

  // --- UI Handlers ---
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: safeUser.name, text: message, time: 'Now' }]);
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* MAIN STAGE */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg tracking-tight text-slate-100">{classData?.title || 'Classroom'}</h2>
            <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-400 font-mono flex items-center gap-2 border border-white/5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live
            </div>
          </div>
          {isHost && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300">
               <ShieldCheck className="w-3.5 h-3.5" /> Host Active
             </div>
          )}
        </header>

        {/* VIDEO GRID */}
        <main className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <div className="w-full max-w-7xl h-full flex flex-col justify-center">
            <div className={`grid gap-4 w-full h-full content-center ${
              (remotePeers.size + 1) <= 2 ? 'grid-cols-1 md:grid-cols-2 max-h-[60vh]' : 'grid-cols-3 md:grid-cols-4'
            }`}>
              
              {/* Local User */}
              <div className="aspect-video w-full">
                <VideoPlayer stream={isCameraOff ? null : localStream} isLocal={true} name={safeUser.name} />
              </div>

              {/* Remote Users */}
              {Array.from(remotePeers.values()).map((peer) => (
                <div key={peer.id} className="aspect-video w-full">
                  <VideoPlayer stream={peer.stream} isLocal={false} name={peer.name} />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* CONTROLS */}
        <footer className="h-20 bg-slate-900 border-t border-white/5 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className={`p-4 rounded-2xl transition-all duration-200 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800'}`}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-all duration-200 ${isCameraOff ? 'bg-red-500/20 text-red-500' : 'bg-slate-800'}`}>
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            
            <button 
              className={`p-4 rounded-2xl transition-all duration-200 ${!isHost && screenShareLocked ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            {isHost && (
              <button onClick={() => setIsRecording(!isRecording)} className={`p-4 rounded-2xl transition-all duration-200 ${isRecording ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-slate-800 hover:bg-slate-700'}`}>
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
              </button>
            )}

            <button onClick={onLeave} className="ml-4 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 font-semibold flex items-center gap-2">
              <PhoneOff className="w-5 h-5" /> End
            </button>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')} className={`p-3 rounded-xl transition-all duration-200 ${activeSidebar === 'participants' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
              <Users className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} className={`p-3 rounded-xl transition-all duration-200 ${activeSidebar === 'chat' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>

      {/* Sidebar Panel */}
      <div className={`bg-slate-900 border-l border-white/5 flex flex-col transition-all duration-300 ease-in-out ${activeSidebar ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <h3 className="font-bold text-slate-100">{activeSidebar === 'chat' ? 'Chat' : 'Participants'}</h3>
          <button onClick={() => setActiveSidebar(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {activeSidebar === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                 <div key={i} className="bg-slate-800 p-3 rounded-xl text-sm border border-white/5 shadow-sm">
                   <div className="font-bold text-indigo-400 text-xs mb-1">{msg.sender}</div>
                   <div className="text-slate-200">{msg.text}</div>
                 </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-white/5 relative">
              <input value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-800 text-white pl-4 pr-10 py-3 rounded-xl text-sm border border-slate-700 focus:border-indigo-500 focus:outline-none placeholder-slate-500 transition-all" placeholder="Message..." />
              <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}

        {activeSidebar === 'participants' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Host Controls */}
            {isHost && (
                <div className="p-4 border-b border-white/10 bg-indigo-900/10 mb-2 rounded-lg">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Host Controls</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Screen Share</span>
                    <button onClick={() => setScreenShareLocked(!screenShareLocked)} className={`text-xs px-2 py-1 rounded font-bold transition-colors ${screenShareLocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {screenShareLocked ? 'LOCKED' : 'OPEN'}
                    </button>
                  </div>
                </div>
            )}
            
            {/* Participant List (Local + Remote) */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">{safeUser.name.charAt(0)}</div>
               <span className="text-sm font-medium text-slate-200">{safeUser.name} (You)</span>
            </div>
            {Array.from(remotePeers.values()).map(p => (
               <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-sm">?</div>
                 <span className="text-sm text-slate-300">{p.name}</span>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}