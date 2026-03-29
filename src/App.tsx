import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  QrCode, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  MessageSquare, 
  Users, 
  Play, 
  Pause,
  Trash2,
  Plus,
  LogOut,
  Zap,
  Image as ImageIcon,
  Video,
  Mic,
  File as FileIcon,
  Edit2,
  X,
  User,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AutoResponse {
  id: string;
  trigger: string;
  message: string;
  responseType?: 'text' | 'pix_api';
  pixApiUrl?: string;
  pixValue?: string;
  mediaPosition: 'top' | 'bottom';
  respondToSelf: boolean;
  sendAsCaption: boolean;
  mediaPath: string | null;
  mimeType: string | null;
  fileName: string | null;
  active: boolean;
  group?: string;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessions, setSessions] = useState<{ id: string, name: string, status: string, phoneNumber?: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'pairing'>('qr');
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [isPairing, setIsPairing] = useState(false);
  const [sessionName, setSessionName] = useState('Minha Conexão');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  
  const [useGemini, setUseGemini] = useState(false);
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Minhas-Response State
  const [autoResponses, setAutoResponses] = useState<AutoResponse[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [triggerInput, setTriggerInput] = useState('');
  const [autoMsgInput, setAutoMsgInput] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'pix_api'>('text');
  const [pixApiUrl, setPixApiUrl] = useState('');
  const [mediaPosition, setMediaPosition] = useState<'top' | 'bottom'>('top');
  const [respondToSelf, setRespondToSelf] = useState(false);
  const [sendAsCaption, setSendAsCaption] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ fileName: string | null, mimeType: string | null, mediaPath: string | null } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [responseFilter, setResponseFilter] = useState<'all' | 'mine' | 'others'>('all');
  const [groupInput, setGroupInput] = useState('Padrão');
  const [selectedGroup, setSelectedGroup] = useState('all');

  const startEditing = (res: AutoResponse) => {
    setEditingId(res.id);
    setTriggerInput(res.trigger);
    setAutoMsgInput(res.message);
    setResponseType(res.responseType || 'text');
    setPixApiUrl(res.pixApiUrl || '');
    setMediaPosition(res.mediaPosition || 'top');
    setRespondToSelf(res.respondToSelf || false);
    setSendAsCaption(res.sendAsCaption !== false);
    setGroupInput(res.group || 'Padrão');
    setSelectedFile(null);
    setExistingMedia({
      fileName: res.fileName || null,
      mimeType: res.mimeType || null,
      mediaPath: res.mediaPath || null
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTriggerInput('');
    setAutoMsgInput('');
    setResponseType('text');
    setPixApiUrl('');
    setMediaPosition('top');
    setRespondToSelf(false);
    setSendAsCaption(true);
    setSelectedFile(null);
    setExistingMedia(null);
    setGroupInput('Padrão');
  };

  useEffect(() => {
    const socketUrl = window.location.origin;
    console.log('Conectando ao socket em:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket conectado');
    });

    newSocket.on('qr', (qr: string) => {
      setQrCode(qr);
      setPairingCode(null);
      setStatus('disconnected');
      if (qr) setConnectionLogs(prev => [...prev.slice(-4), 'QR Code recebido!']);
    });

    newSocket.on('pairing-code', (code: string) => {
      setPairingCode(code);
      setQrCode(null);
      setStatus('disconnected');
      if (code) setConnectionLogs(prev => [...prev.slice(-4), 'Código de pareamento recebido!']);
    });

    newSocket.on('log', (message: string) => {
      setConnectionLogs(prev => [...prev.slice(-4), message]);
    });

    newSocket.on('status', (newStatus: 'connected' | 'disconnected') => {
      setStatus(newStatus);
      setConnectionLogs(prev => [...prev.slice(-4), `Status: ${newStatus}`]);
      if (newStatus === 'connected') {
        setQrCode(null);
        setPairingCode(null);
      }
      // Refresh session list to update status indicators
      fetchSessions();
    });

    newSocket.on('sessions-updated', () => {
      fetchSessions();
    });

    newSocket.on('responses-updated', ({ responses }) => {
      setAutoResponses(responses);
    });

    // Keep-alive: Heartbeat via socket
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat');
      }
    }, 30000);

    // Keep-alive: Ping via HTTP
    const pingInterval = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 60000);

    return () => {
      newSocket.close();
      clearInterval(heartbeatInterval);
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    if (socket && activeSessionId) {
      socket.emit('join-session', activeSessionId);
    }
  }, [socket, activeSessionId]);

  const fetchSessions = async (retries = 3) => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSessions(data);
      
      setActiveSessionId(currentId => {
        // Se houver sessões e o ID atual não estiver na lista (ou estiver vazio),
        // seleciona a primeira sessão disponível como padrão.
        if (data.length > 0) {
          if (!currentId || !data.find((s: any) => s.id === currentId)) {
            return data[0].id;
          }
          return currentId;
        }
        // Se não houver sessões, usamos 'default' para permitir salvar respostas
        return 'default';
      });
    } catch (e) {
      console.error('Erro ao carregar sessões', e);
      if (retries > 0) {
        console.log(`Tentando carregar sessões novamente (${retries} tentativas restantes)...`);
        setTimeout(() => fetchSessions(retries - 1), 5000);
      }
    }
  };

  const loadSessionData = async (sessionId: string) => {
    setIsLoadingSession(true);
    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/status/${sessionId}`);
        
        if (!res.ok) {
          const text = await res.text();
          if ((text.includes('<!doctype html>') || text.includes('<html')) && attempt < maxRetries) {
            attempt++;
            console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return executeRequest();
          }
        }

        const data = await res.json();
        if (data.status === 'open') setStatus('connected');
        else setStatus('disconnected');
        setQrCode(data.qr);
        setPairingCode(data.pairingCode);
        setSessionName(data.sessionName);
        setTempName(data.sessionName);
        setIsEditingName(false);
        setConnectedPhone(data.phoneNumber);
        setUseGemini(data.useGemini || false);
        setGeminiPrompt(data.geminiPrompt || '');

        const respRes = await fetch(`/api/auto-responses/${sessionId}`);
        const respData = await respRes.json();
        setAutoResponses(respData);
      } catch (e) {
        console.error('Erro ao carregar dados da sessão', e);
      } finally {
        setIsLoadingSession(false);
      }
    };

    await executeRequest();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionData(activeSessionId);
      setConnectionLogs([]);
    }
  }, [activeSessionId]);

  const createNewSession = async () => {
    if (!newSessionName.trim()) return;
    setIsLoadingSession(true);
    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSessionName })
        });

        if (!res.ok) {
          const text = await res.text();
          if ((text.includes('<!doctype html>') || text.includes('<html')) && attempt < maxRetries) {
            attempt++;
            console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return executeRequest();
          }
          throw new Error('Erro no servidor ao criar sessão');
        }

        const data = await res.json();
        
        setNewSessionName('');
        setIsCreatingSession(false);
        setActiveSessionId(data.id);
        
        // fetchSessions will be called by the socket event 'sessions-updated'
        // but we call it here too to be safe and immediate
        await fetchSessions();
      } catch (e) {
        console.error('Erro ao criar sessão:', e);
        alert('Erro ao criar nova conexão. O servidor pode estar reiniciando.');
      } finally {
        setIsLoadingSession(false);
      }
    };

    await executeRequest();
  };

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/delete`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao excluir no servidor');
      
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== id);
        setActiveSessionId(currentId => {
          if (currentId === id) {
            return filtered[0]?.id || '';
          }
          return currentId;
        });
        return filtered;
      });
      setShowDeleteConfirm(null);
    } catch (e) {
      console.error('Erro ao excluir sessão', e);
      alert('Erro ao excluir a conexão. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`/api/logout/${activeSessionId}`, { method: 'POST' });
      setStatus('disconnected');
      setQrCode(null);
      setPairingCode(null);
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout falhou', error);
      alert('Erro ao sair da conta.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`/api/disconnect/${activeSessionId}`, { method: 'POST' });
      setStatus('disconnected');
      setQrCode(null);
      setPairingCode(null);
    } catch (error) {
      console.error('Desconexão falhou', error);
    }
  };

  const updateSessionName = async () => {
    if (!tempName.trim() || tempName === sessionName) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/session/name/${activeSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName })
      });
      if (res.ok) {
        setSessionName(tempName);
        setIsEditingName(false);
        // The sidebar will update via the 'sessions-updated' socket event
        // but we update locally for immediate feedback
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, name: tempName } : s));
      } else {
        alert('Erro ao renomear conexão.');
      }
    } catch (error) {
      console.error('Erro ao atualizar nome da sessão', error);
      alert('Erro de conexão ao renomear.');
    }
  };

  const handlePairingRequest = async () => {
    if (!phoneNumber) return;
    setIsPairing(true);
    try {
      const res = await fetch(`/api/pair/${activeSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (data.code) setPairingCode(data.code);
    } catch (error) {
      console.error('Erro ao solicitar código de pareamento', error);
    } finally {
      setIsPairing(false);
    }
  };

  // Minhas-Response Actions
  const saveAutoResponse = async () => {
    const sid = activeSessionId || 'default';

    if (!triggerInput) {
      alert('Preencha pelo menos o gatilho');
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('trigger', triggerInput);
    formData.append('message', autoMsgInput);
    formData.append('responseType', responseType);
    formData.append('pixApiUrl', pixApiUrl);
    formData.append('mediaPosition', mediaPosition);
    formData.append('respondToSelf', String(respondToSelf));
    formData.append('sendAsCaption', String(sendAsCaption));
    formData.append('group', groupInput);
    if (selectedFile) {
      formData.append('media', selectedFile);
    } else if (editingId && !existingMedia) {
      formData.append('removeMedia', 'true');
    }

    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const url = editingId ? `/api/auto-responses/${sid}/${editingId}` : `/api/auto-responses/${sid}`;
        const method = 'POST';
        
        const response = await fetch(url, {
          method,
          body: formData
        });

        if (!response.ok) {
          let errorMessage = `Erro do servidor: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (e) {
            try {
              const text = await response.text();
              if (text.includes('<!doctype html>') || text.includes('<html')) {
                if (attempt < maxRetries) {
                  attempt++;
                  console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  return executeRequest();
                }
                errorMessage = "O servidor está reiniciando para aplicar as alterações. Por favor, aguarde 5-10 segundos e tente salvar novamente.";
              } else {
                errorMessage = text.substring(0, 100) || errorMessage;
              }
            } catch (e2) {}
          }
          throw new Error(errorMessage);
        }

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
        } else {
          const text = await response.text();
          if (text.includes('<!doctype html>') || text.includes('<html')) {
            if (attempt < maxRetries) {
              attempt++;
              console.log(`Tentativa ${attempt} falhou (HTML recebido com 200 OK). Tentando novamente em 3s...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
              return executeRequest();
            }
            throw new Error("O servidor retornou uma página HTML em vez de JSON. Isso geralmente acontece durante o reinício do servidor. Por favor, aguarde alguns segundos e tente novamente.");
          }
          console.error('Resposta não-JSON recebida:', text.substring(0, 100));
          throw new Error(`Resposta inválida do servidor (não é JSON).`);
        }

        if (editingId) {
          setAutoResponses(prev => prev.map(r => r.id === editingId ? data : r));
        } else {
          setAutoResponses(prev => [...prev, data]);
        }
        
        setTriggerInput('');
        setAutoMsgInput('');
        setSelectedFile(null);
        setExistingMedia(null);
        setEditingId(null);
      } catch (error: any) {
        console.error('Erro ao salvar auto-resposta', error);
        alert(error instanceof Error ? error.message : 'Erro ao salvar autoresposta');
      } finally {
        setIsUploading(false);
      }
    };

    await executeRequest();
  };

  const deleteAutoResponse = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta resposta?')) return;
    
    const sid = activeSessionId || 'default';
    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/auto-responses/${sid}/${id}/delete`, { method: 'POST' });
        
        if (!res.ok) {
          const text = await res.text();
          if ((text.includes('<!doctype html>') || text.includes('<html')) && attempt < maxRetries) {
            attempt++;
            console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return executeRequest();
          }
          throw new Error('Falha ao excluir resposta');
        }
        
        setAutoResponses(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error('Erro ao deletar auto-resposta', error);
        alert('Erro ao excluir autoresposta. O servidor pode estar reiniciando.');
      }
    };

    await executeRequest();
  };

  const toggleAutoResponse = async (id: string) => {
    const sid = activeSessionId || 'default';
    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/auto-responses/${sid}/${id}/toggle`, { method: 'POST' });
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          const text = await res.text();
          if ((text.includes('<!doctype html>') || text.includes('<html')) && attempt < maxRetries) {
            attempt++;
            console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return executeRequest();
          }
          throw new Error('O servidor está reiniciando. Aguarde.');
        }

        if (!res.ok) throw new Error(data?.error || 'Erro ao alternar');
        setAutoResponses(prev => prev.map(r => r.id === id ? data : r));
      } catch (error) {
        console.error('Erro ao alternar auto-resposta', error);
        alert('Erro ao alterar status. O servidor pode estar reiniciando.');
      }
    };

    await executeRequest();
  };

  const duplicateAutoResponse = async (id: string) => {
    const sid = activeSessionId || 'default';
    const maxRetries = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/auto-responses/${sid}/${id}/duplicate`, { method: 'POST' });
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          const text = await res.text();
          if ((text.includes('<!doctype html>') || text.includes('<html')) && attempt < maxRetries) {
            attempt++;
            console.log(`Tentativa ${attempt} falhou (HTML recebido). Tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return executeRequest();
          }
          throw new Error('O servidor está reiniciando para salvar as alterações. Aguarde 5 segundos.');
        }

        if (!res.ok) throw new Error(data?.error || 'Erro ao duplicar autoresposta');
        setAutoResponses(prev => [...prev, data]);
      } catch (error) {
        console.error('Erro ao duplicar auto-resposta', error);
        alert('Erro ao duplicar autoresposta. O servidor pode estar reiniciando.');
      }
    };

    await executeRequest();
  };

  const refreshStatus = async () => {
    try {
      const res = await fetch(`/api/status/${activeSessionId}`);
      const data = await res.json();
      if (data.status === 'open') setStatus('connected');
      else setStatus('disconnected');
      setQrCode(data.qr);
      setPairingCode(data.pairingCode);
      setUseGemini(data.useGemini || false);
      setGeminiPrompt(data.geminiPrompt || '');
    } catch (error) {
      console.error('Erro ao atualizar status', error);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/settings/${activeSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useGemini,
          geminiPrompt
        })
      });
      if (res.ok) {
        setShowSettings(false);
      } else {
        alert('Erro ao salvar configurações.');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações', error);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex">
      {/* Sidebar for Sessions */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <span className="font-bold text-emerald-600 tracking-tight">Kabot Multi</span>
          </div>
          
          {isCreatingSession ? (
            <div className="space-y-2">
              <input 
                type="text" 
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Nome da conexão..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createNewSession()}
              />
              <div className="flex gap-2">
                <button 
                  onClick={createNewSession}
                  className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  Criar
                </button>
                <button 
                  onClick={() => { setIsCreatingSession(false); setNewSessionName(''); }}
                  className="flex-1 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreatingSession(true)}
              className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl font-medium text-sm hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Nova Conexão
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Suas Conexões</h3>
              {sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    activeSessionId === s.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      s.status === 'connected' ? 'bg-emerald-500' : 'bg-zinc-300'
                    }`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      {s.phoneNumber && <span className="text-[10px] text-zinc-400 truncate">{s.phoneNumber}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveSessionId(s.id); 
                        setTempName(s.name); 
                        setIsEditingName(true); 
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-emerald-600 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(s.id); }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100"
                      title="Excluir Conexão"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-zinc-200">
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Status Global</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{sessions.filter(s => s.status === 'connected').length} Ativas</span>
                  <span className="text-[10px] text-zinc-400">{sessions.length} Total</span>
                </div>
              </div>
            </div>
          </aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Configurações da Conexão</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Gemini AI Settings */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" />
                      Inteligência Artificial (Gemini)
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useGemini} 
                        onChange={(e) => setUseGemini(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  
                  <div className={`space-y-4 transition-all duration-300 ${useGemini ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Instruções do Sistema (Prompt)</label>
                      <textarea 
                        value={geminiPrompt} 
                        onChange={(e) => setGeminiPrompt(e.target.value)}
                        placeholder="Ex: Você é um assistente de vendas da loja X. Seja cordial e tire dúvidas sobre os produtos..."
                        rows={4}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      * O Gemini responderá automaticamente a qualquer mensagem que não coincida com seus gatilhos de auto-resposta.
                    </p>
                  </div>
                </section>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={saveSettings}
                  disabled={isSavingSettings}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Salvar Configurações
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Excluir Conexão?</h3>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Tem certeza que deseja excluir esta conexão? Todos os dados de autenticação e auto-respostas serão apagados permanentemente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => deleteSession(showDeleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors shadow-sm"
                >
                  Sim, Excluir
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-medium text-sm hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Sair da Conta?</h3>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Isso irá desconectar o WhatsApp e apagar os dados de autenticação desta sessão. Você precisará escanear o QR Code novamente para conectar.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Sair
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-medium text-sm hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-sm font-semibold text-emerald-600 bg-zinc-50 border border-zinc-200 rounded px-1 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && updateSessionName()}
                      />
                      <button onClick={updateSessionName} className="text-emerald-600 hover:text-emerald-700">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={() => setIsEditingName(false)} className="text-zinc-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <h1 className="font-semibold text-lg tracking-tight text-emerald-600">{sessionName}</h1>
                      <button 
                        onClick={() => { setTempName(sessionName); setIsEditingName(true); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-emerald-600 transition-all"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Configurações da Sessão</span>
                  {connectedPhone && <span className="text-[10px] text-emerald-500 font-bold">({connectedPhone})</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                }`} />
                {status === 'connected' ? 'Conectado' : 'Desconectado'}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors"
                  title="Configurações da Conexão"
                >
                  <Zap size={18} />
                </button>
                {/* Removed Pause/Disconnect button as requested by user */}
                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors" 
                  title="Sair e Limpar Dados"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          {isLoadingSession ? (
            <div className="col-span-12 flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-sm">Carregando dados da sessão...</p>
            </div>
          ) : (
            <>
              {/* Left Column: Connection & Setup */}
              <div className="md:col-span-5 space-y-6">
            {/* Connection Card */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Conexão</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={refreshStatus}
                    className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors bg-zinc-100 rounded-lg"
                    title="Atualizar Status"
                  >
                    <Loader2 size={14} className={status === 'connecting' ? 'animate-spin' : ''} />
                  </button>
                  {status !== 'connected' && (
                    <div className="flex bg-zinc-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setConnectionMethod('qr')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all ${
                        connectionMethod === 'qr' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      QR Code
                    </button>
                    <button 
                      onClick={() => setConnectionMethod('pairing')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all ${
                        connectionMethod === 'pairing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      Número
                    </button>
                  </div>
                )}
              </div>
            </div>

            {status !== 'connected' ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  {connectionMethod === 'qr' ? (
                    <>
                      {qrCode ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-white border border-zinc-200 rounded-xl shadow-inner">
                          <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                        </motion.div>
                      ) : (
                        <div className="w-48 h-48 bg-zinc-100 rounded-xl flex flex-col items-center justify-center text-zinc-400">
                          <Loader2 className="animate-spin mb-2" />
                          <span className="text-xs text-center">Gerando QR Code...</span>
                          <button 
                            onClick={async () => {
                              try {
                                await fetch(`/api/logout/${activeSessionId}`, { method: 'POST' });
                                refreshStatus();
                              } catch (e) {
                                console.error('Erro ao forçar nova conexão', e);
                              }
                            }}
                            className="mt-4 text-[10px] text-emerald-600 hover:underline font-bold uppercase"
                          >
                            Forçar Novo QR
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-center text-zinc-500 max-w-[200px]">Abra o WhatsApp no seu celular e escaneie o código.</p>
                      
                      {connectionLogs.length > 0 && (
                        <div className="mt-4 w-full bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Status da Conexão:</p>
                          {connectionLogs.map((log, i) => (
                            <p key={i} className="text-[9px] text-zinc-500 font-mono truncate">{log}</p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      {pairingCode ? (
                        <div className="flex flex-col items-center space-y-4 py-4">
                          <div className="flex gap-2">
                            {pairingCode.split('').map((char, i) => (
                              <div key={i} className="w-8 h-10 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center font-mono font-bold text-lg text-emerald-600">
                                {char}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-center text-zinc-500">Insira este código no seu WhatsApp (Aparelhos Conectados &gt; Conectar com número de telefone).</p>
                          <button 
                            onClick={() => { setPairingCode(null); setPhoneNumber(''); }}
                            className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                          >
                            Tentar outro número
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-tight text-zinc-400 mb-1.5 ml-1">Número do WhatsApp</label>
                            <input 
                              type="text" 
                              value={phoneNumber} 
                              onChange={(e) => setPhoneNumber(e.target.value)} 
                              placeholder="Ex: 5511999999999" 
                              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                            />
                            <p className="text-[10px] text-zinc-400 mt-1.5 ml-1">Inclua o código do país (DDI) e o DDD.</p>
                          </div>
                          <button 
                            onClick={handlePairingRequest} 
                            disabled={!phoneNumber || isPairing}
                            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isPairing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                            Gerar Código
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="font-medium">Conta Vinculada</p>
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(`/api/reconnect/${activeSessionId}`, { method: 'POST' });
                          refreshStatus();
                        } catch (e) {
                          console.error('Erro ao forçar reconexão', e);
                        }
                      }}
                      className="text-[10px] text-zinc-400 hover:text-emerald-600 underline font-bold uppercase"
                    >
                      Forçar Reconexão
                    </button>
                  </div>
              )}
            </section>

            {/* Setup Form Card */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  {editingId ? 'Editar Resposta' : 'Nova Resposta'}
                </h2>
                {editingId && (
                  <button 
                    onClick={cancelEditing}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 rounded-lg"
                    title="Cancelar Edição"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex p-1 bg-zinc-100 rounded-xl mb-6">
                <button 
                  onClick={() => setRespondToSelf(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!respondToSelf ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <Users size={14} />
                  Para Clientes
                </button>
                <button 
                  onClick={() => setRespondToSelf(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${respondToSelf ? 'bg-white text-amber-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <User size={14} />
                  Para Mim
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Gatilho (Palavra-chave do Anúncio)</label>
                  <input type="text" value={triggerInput} onChange={(e) => setTriggerInput(e.target.value)} placeholder="Ex: Tenho interesse" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Conjunto de respostas salvas (Agrupamento)</label>
                  <input type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} placeholder="Ex: Padrão, Vendas, Suporte" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Mensagem de Resposta</label>
                  <textarea value={autoMsgInput} onChange={(e) => setAutoMsgInput(e.target.value)} placeholder="Olá! Como posso ajudar?" className="w-full h-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" />
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <label className="block text-[10px] font-bold uppercase tracking-tight text-zinc-400 mb-2">Tipo de Resposta</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setResponseType('text')}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                        responseType === 'text' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      Texto
                    </button>
                    <button 
                      onClick={() => setResponseType('pix_api')}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                        responseType === 'pix_api' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      Pix API
                    </button>
                  </div>
                </div>

                {responseType === 'pix_api' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL da API de Pix ou Chave EasyPIX (Opcional)</label>
                      <input 
                        type="text" 
                        value={pixApiUrl} 
                        onChange={(e) => setPixApiUrl(e.target.value)} 
                        placeholder="Chave API EasyPIX padrão já configurada" 
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        * A chave API EasyPIX padrão já está gravada no código para sua conveniência.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Pix Value field removed as it is no longer used as a default */}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-emerald-600 font-medium">
                        O código Pix será enviado automaticamente em uma mensagem separada.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Anexo (Foto, Vídeo ou Áudio)</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all">
                        <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept="image/*,video/*,audio/*" />
                        {selectedFile ? (
                          <span className="text-xs truncate max-w-[150px]">{selectedFile.name}</span>
                        ) : existingMedia?.mediaPath ? (
                          <span className="text-xs truncate max-w-[150px] text-emerald-600 font-medium">
                            {existingMedia.fileName || 'Arquivo atual'}
                          </span>
                        ) : (
                          <>
                            <ImageIcon size={16} className="text-zinc-400" />
                            <span className="text-xs text-zinc-400">Selecionar arquivo</span>
                          </>
                        )}
                      </label>
                      {selectedFile && <button onClick={() => setSelectedFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                      {editingId && existingMedia?.mediaPath && !selectedFile && (
                        <button 
                          onClick={() => setExistingMedia(null)} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remover anexo atual"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    {(selectedFile || editingId) && (
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <label className="block text-[10px] font-bold uppercase tracking-tight text-zinc-400 mb-2">Posição do Anexo</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setMediaPosition('top')}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                              mediaPosition === 'top' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                                : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            No Início
                          </button>
                          <button 
                            onClick={() => setMediaPosition('bottom')}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                              mediaPosition === 'bottom' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                                : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            No Final
                          </button>
                        </div>
                      </div>
                    )}

                    {(selectedFile || editingId) && (selectedFile?.type.startsWith('image/') || selectedFile?.type.startsWith('video/') || (editingId && autoResponses.find(r => r.id === editingId)?.mimeType?.match(/image|video/))) && (
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div 
                            onClick={() => setSendAsCaption(!sendAsCaption)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sendAsCaption ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 group-hover:border-emerald-400'}`}
                          >
                            {sendAsCaption && <CheckCircle2 size={10} strokeWidth={4} />}
                          </div>
                          <span className="text-xs text-zinc-600 select-none">Enviar mensagem como legenda do anexo</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={saveAutoResponse} disabled={!triggerInput || isUploading} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  {editingId ? 'Atualizar Resposta' : 'Salvar Resposta'}
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Tasks/Responses List */}
          <div className="md:col-span-7 space-y-6">
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm min-h-[400px]">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Respostas Configuradas
                  </h2>
                  <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500 font-mono">
                    {`${autoResponses.filter(r => r.active).length}/${autoResponses.length}`}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex p-1 bg-zinc-100 rounded-xl w-fit">
                    <button 
                      onClick={() => setResponseFilter('all')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${responseFilter === 'all' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      Todas
                    </button>
                    <button 
                      onClick={() => setResponseFilter('others')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${responseFilter === 'others' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      <Users size={12} />
                      Para Clientes
                    </button>
                    <button 
                      onClick={() => setResponseFilter('mine')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${responseFilter === 'mine' ? 'bg-white text-amber-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      <User size={12} />
                      Para Mim
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 px-2">Conjunto:</span>
                    <select 
                      value={selectedGroup} 
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="text-xs font-bold bg-white text-emerald-600 rounded-lg px-3 py-1.5 focus:outline-none shadow-sm border-none"
                    >
                      <option value="all">Todos os Conjuntos</option>
                      {Array.from(new Set(autoResponses.map(r => r.group || 'Padrão'))).sort().map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {autoResponses.filter(r => {
                    const matchesType = responseFilter === 'all' || (responseFilter === 'mine' ? r.respondToSelf : !r.respondToSelf);
                    const matchesGroup = selectedGroup === 'all' || (r.group || 'Padrão') === selectedGroup;
                    return matchesType && matchesGroup;
                  }).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                      <Zap size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="text-sm">Nenhuma resposta encontrada nesta categoria</p>
                    </div>
                  ) : (
                    autoResponses
                      .filter(r => {
                        const matchesType = responseFilter === 'all' || (responseFilter === 'mine' ? r.respondToSelf : !r.respondToSelf);
                        const matchesGroup = selectedGroup === 'all' || (r.group || 'Padrão') === selectedGroup;
                        return matchesType && matchesGroup;
                      })
                      .map((res) => (
                        <motion.div key={res.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-4 border border-zinc-100 rounded-xl bg-zinc-50/50 transition-opacity ${!res.active ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-tight text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Gatilho</span>
                              <span className="text-sm font-semibold">"{res.trigger}"</span>
                              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded ml-auto">
                                {res.group || 'Padrão'}
                              </span>
                              {res.respondToSelf && (
                                <span className="text-[10px] font-bold uppercase tracking-tight text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1" title="Responde às suas próprias mensagens">
                                  <User size={10} />
                                  Para Mim
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-600">{res.message}</p>
                            {res.responseType === 'pix_api' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-white border border-zinc-100 px-2 py-1 rounded-lg w-fit">
                                  <Zap size={12} className="text-amber-500" />
                                  <span>Pix via API: {res.pixApiUrl || 'Chave Padrão'}</span>
                                </div>
                                {res.pixValue && (
                                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg w-fit">
                                    <span>R$ {res.pixValue}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {res.mediaPath && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-white border border-zinc-100 px-2 py-1 rounded-lg w-fit">
                                    {res.mimeType?.startsWith('image/') ? <ImageIcon size={12} /> : res.mimeType?.startsWith('video/') ? <Video size={12} /> : <Mic size={12} />}
                                    <span>{res.fileName}</span>
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                                    {res.mediaPosition === 'bottom' ? 'No Final' : 'No Início'}
                                  </span>
                                </div>
                                {res.mimeType?.startsWith('image/') && (
                                  <img 
                                    src={`/uploads/${res.mediaPath.split('/').pop()}`} 
                                    alt="Preview" 
                                    className="w-24 h-24 object-cover rounded-lg border border-zinc-200"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditing(res)} 
                              className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => duplicateAutoResponse(res.id)} 
                              className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Duplicar"
                            >
                              <Copy size={18} />
                            </button>
                            <button 
                              onClick={() => toggleAutoResponse(res.id)} 
                              className={`p-2 rounded-lg transition-colors ${res.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                              title={res.active ? 'Desativar' : 'Ativar'}
                            >
                              <Zap size={18} fill={res.active ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => deleteAutoResponse(res.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
      </div>
    </div>
  );
}
