import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay,
    generateWAMessageFromContent,
    proto
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

// Default responses fallback
let DEFAULT_RESPONSES: any[] = [
  {
    "id": "1774246595207",
    "trigger": "Olá! Tenho interesse e queria mais informações, por favor.",
    "message": "🚀 UBER/99 PRA RODAR HOJE\r\nAprovação garantida !\r\n\r\n✅ SEU NOME\r\n✅ SUA FOTO\r\n✅ SUA FACIAL\r\n✅ SEU VEÍCULO \r\n\r\n💰 VALOR EM PROMOÇÃO !\r\nUBER - R$ 200,00\r\n99 - R$ 200,00\r\n\r\n🛡️Conta durando mais de 1 ano \r\n(Método ultra resistente)\r\n\r\n⚠️ PAGAMENTO E REGRAS 🚨\r\n(LEIA COM ATENÇÃO)\r\n\r\n1. A PROVA: Envio vídeo da conta pronta com data e hora do momento, fazendo login, os seus dados, validando facial e tocando corrida na sua cidade PROVANDO A CRIAÇÃO DA CONTA DE FORMA DEFINITIVA. \r\n\r\n2. O PAGAMENTO: Conferiu o vídeo, Efetua o pagamento e recebe o acesso imediatamente.\r\n\r\n3. SEM PAPO FURADO: Não mando acesso antes do pagamento. Se está sem dinheiro ou com dúvida, nem chama. Perda de tempo não é comigo.\r\n\r\n🔥 QUER A CONTA EM 3 HORAS?\r\nMande os dados agora:\r\n\r\n1. Qual App:\r\n2. Nome Completo:\r\n3. Foto selfie (Sem boné/óculos):\r\n4. Vídeo selfie (10 segundos):\r\n5. Placa ou Doc do veículo:\r\n6. Sua Cidade:\r\n\r\nMANDE OS DADOS E AGUARDE.",
    "responseType": "text",
    "pixApiUrl": "",
    "pixValue": "10.00",
    "pixCpf": null,
    "pixSeparateMessage": true,
    "pixCopyButton": false,
    "buttons": "",
    "mediaPosition": "top",
    "respondToSelf": false,
    "sendAsCaption": true,
    "mediaPath": "uploads/1774368881722-665725815.ogg",
    "mimeType": "audio/ogg",
    "fileName": "WhatsApp Ptt 2026-03-20 at 8.50.35 AM.ogg",
    "active": true,
    "group": "leocontas"
  },
  {
    "id": "1774246805204",
    "trigger": "✅",
    "message": "🚀 UBER/99 PRA RODAR HOJE\r\nAprovação garantida !\r\n\r\n✅ SEU NOME\r\n✅ SUA FOTO\r\n✅ SUA FACIAL\r\n✅ SEU VEÍCULO \r\n\r\n💰 VALOR EM PROMOÇÃO !\r\nUBER - R$ 200,00\r\n99 - R$ 200,00\r\n\r\n🛡️Conta durando mais de 1 ano \r\n(Método ultra resistente)\r\n\r\n⚠️ PAGAMENTO E REGRAS 🚨\r\n(LEIA COM ATENÇÃO)\r\n\r\n1. A PROVA: Envio vídeo da conta pronta com data e hora do momento, fazendo login, os seus dados, validando facial e tocando corrida na sua cidade PROVANDO A CRIAÇÃO DA CONTA DE FORMA DEFINITIVA. \r\n\r\n2. O PAGAMENTO: Conferiu o vídeo, Efetua o pagamento e recebe o acesso imediatamente.\r\n\r\n3. SEM PAPO FURADO: Não mando acesso antes do pagamento. Se está sem dinheiro ou com dúvida, nem chama. Perda de tempo não é comigo.\r\n\r\n🔥 QUER A CONTA EM 3 HORAS?\r\nMande os dados agora:\r\n\r\n1. Qual App:\r\n2. Nome Completo:\r\n3. Foto selfie (Sem boné/óculos):\r\n4. Vídeo selfie (10 segundos):\r\n5. Placa ou Doc do veículo:\r\n6. Sua Cidade:\r\n\r\nMANDE OS DADOS E AGUARDE.",
    "responseType": "text",
    "pixApiUrl": "",
    "pixValue": "10.00",
    "pixCpf": null,
    "pixSeparateMessage": true,
    "pixCopyButton": false,
    "buttons": "",
    "mediaPosition": "top",
    "respondToSelf": true,
    "sendAsCaption": true,
    "mediaPath": "uploads/1774369549593-136271939.ogg",
    "mimeType": "audio/ogg",
    "fileName": "WhatsApp Ptt 2026-03-20 at 8.50.35 AM.ogg",
    "active": true,
    "group": "leocontas"
  },
  {
    "id": "1774247011865",
    "trigger": "Pix",
    "message": "Abaixo, está o pixx copia e cola , após o pagamento o acesso e enviado imediatamente !",
    "responseType": "pix_api",
    "pixApiUrl": "",
    "pixValue": "10.00",
    "pixCpf": null,
    "pixSeparateMessage": true,
    "pixCopyButton": false,
    "buttons": "",
    "mediaPosition": "top",
    "respondToSelf": false,
    "sendAsCaption": true,
    "mediaPath": null,
    "mimeType": null,
    "fileName": null,
    "active": true,
    "group": "leocontas"
  },
  {
    "id": "1774250066852",
    "trigger": "Aprovada ✅",
    "message": "",
    "responseType": "text",
    "pixApiUrl": "",
    "pixValue": "10.00",
    "pixCpf": null,
    "pixSeparateMessage": true,
    "pixCopyButton": false,
    "buttons": "",
    "mediaPosition": "top",
    "respondToSelf": true,
    "sendAsCaption": true,
    "mediaPath": "uploads/1774367746406-361031256.MP4",
    "mimeType": "video/mp4",
    "fileName": "PAGAMENTO 1.MP4",
    "active": true,
    "group": "leocontas"
  },
  {
    "id": "1774367917100",
    "trigger": "Alternativa ✅",
    "message": "Clica no linkparagerar o p ix de pagamento.\r\n\r\nhttps://abre.ai/pagarporpix",
    "responseType": "text",
    "pixApiUrl": null,
    "pixValue": "10.00",
    "pixCpf": null,
    "pixSeparateMessage": true,
    "pixCopyButton": false,
    "buttons": "",
    "mediaPosition": "top",
    "respondToSelf": true,
    "sendAsCaption": false,
    "mediaPath": "uploads/1774367917055-202771943.MP4",
    "mimeType": "video/mp4",
    "fileName": "PAGAMENTO 2 .MP4",
    "active": true,
    "group": "leocontas"
  }
];
try {
    const responsesJsonPath = path.join(process.cwd(), 'responses.json');
    if (fs.existsSync(responsesJsonPath)) {
        const fileContent = fs.readFileSync(responsesJsonPath, 'utf-8');
        if (fileContent.trim()) {
            DEFAULT_RESPONSES = JSON.parse(fileContent);
        }
    }
} catch (err) {
    console.error('Erro ao carregar DEFAULT_RESPONSES:', err);
}

// Configure multer for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Default Pix API Key (EasyPIX)
const DEFAULT_PIX_API_KEY = process.env.EASYPIX_API_KEY || "";

async function startServer() {
    const app = express();
    
    // Basic middleware
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use('/uploads', express.static(UPLOADS_DIR));
    
    // Request logger middleware
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                // Allow same origin and AI Studio origins
                if (!origin || origin.includes('localhost') || origin.includes('.run.app')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        allowEIO3: true,
        transports: ['websocket', 'polling']
    });

    const PORT = 3000;

    // Global error handlers to prevent silent crashes
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        // We don't exit the process here to keep the server running
    });

    // Save metadata on shutdown
    const handleShutdown = () => {
        console.log('Encerrando servidor... Salvando metadados...');
        saveSessionsMetadata();
        process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    // Self-ping mechanism to keep the container active 24/7
    const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try {
            const res = await fetch(`${APP_URL}/api/ping`);
            if (res.ok) {
                console.log(`[${new Date().toISOString()}] Auto-Ping: Sucesso (Keep-Alive)`);
            } else {
                console.warn(`[${new Date().toISOString()}] Auto-Ping: Falha (${res.status})`);
            }
        } catch (e) {
            console.error(`[${new Date().toISOString()}] Auto-Ping: Erro de rede:`, e instanceof Error ? e.message : String(e));
        }
    }, 60 * 1000); // Ping every 1 minute for aggressive persistence

    // Background checker for missed messages and session health
    setInterval(() => {
        sessions.forEach((session, sessionId) => {
            // 1. Health Check - Balanced
            const now = Date.now();
            const lastAttempt = session.lastConnectionAttempt || 0;
            
            // If it's been more than 3 minutes and it's still "connecting", something is wrong
            if (session.isConnecting && (now - lastAttempt > 180000)) {
                console.log(`[${sessionId}] Watchdog: Conexão travada em 'connecting' por mais de 3 minutos. Resetando...`);
                session.isConnecting = false;
                (session as any)._connectingLock = false;
            }

            if (session.status === 'close' && !session.isConnecting && session.id) {
                const lastConflict = session.lastConflictTime || 0;
                // Deixa o connectToWhatsApp lidar com a reconexão agendada por conflito
                // Aumentado para 2 minutos para dar tempo ao backoff normal
                if (now - lastConflict > 120000) { 
                    console.log(`[${sessionId}] Watchdog: Sessão desconectada por muito tempo. Tentando reconexão de segurança...`);
                    connectToWhatsApp(sessionId, 'watchdog_reconnect');
                }
            }

            // 2. Missed Messages Check
            if (session.status === 'open' && session.sock && (session as any).processMessage) {
                const now = Math.floor(Date.now() / 1000);
                session.messageLog.forEach(log => {
                    if (!log.responded && (log.retryCount || 0) < 5 && (now - log.timestamp > 45) && (now - log.timestamp < 1800)) {
                        log.retryCount = (log.retryCount || 0) + 1;
                        (async () => {
                            try {
                                await (session as any).processMessage({ 
                                    key: { id: log.id, remoteJid: log.remoteJid, fromMe: log.fromMe }, 
                                    message: { conversation: log.text },
                                    messageTimestamp: log.timestamp
                                });
                            } catch (e) {
                                console.error(`[${sessionId}] Verificador: Falha na tentativa ${log.retryCount} para ${log.id}:`, e);
                            }
                        })();
                    }
                });
            }
        });
    }, 60000);

    // WhatsApp Multi-Session Logic
    interface Session {
        id: string;
        name: string;
        sock: any;
        qrCode: string | null;
        pairingCode: string | null;
        status: 'connecting' | 'open' | 'close' | 'qr';
        isConnecting: boolean;
        autoResponses: any[];
        phoneNumber: string | null;
        reconnectCount: number;
        conflictCount?: number;
        lastConflictTime?: number;
        lastConnectionAttempt?: number;
        watchdogTimer?: NodeJS.Timeout;
        processedMessages: Set<string>;
        messageLog: any[];
        userStates: Map<string, { step: string, data?: any }>;
        useGemini?: boolean;
        geminiPrompt?: string;
    }

    const sessions = new Map<string, Session>();
    const SESSIONS_FILE = 'sessions_metadata.json';

    const fetchWithRetry = async (url: string, options: any = {}, maxRetries = 3, delay = 2000) => {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) return res;
                if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
                    console.log(`[Fetch] Erro transiente ${res.status} ao acessar ${url}. Tentativa ${i + 1}/${maxRetries} em ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }
                return res; // Return other errors (404, 401, etc) directly
            } catch (e) {
                lastError = e;
                console.log(`[Fetch] Erro de rede ao acessar ${url}. Tentativa ${i + 1}/${maxRetries} em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
        throw lastError || new Error(`Falha após ${maxRetries} tentativas`);
    };

    const loadSessionsMetadata = () => {
        if (fs.existsSync(SESSIONS_FILE)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
                if (Array.isArray(metadata) && metadata.length > 0) {
                    return metadata;
                }
            } catch (e) {
                console.error('Erro ao ler metadados das sessões:', e);
            }
        }
        // Sempre garante que existe pelo menos uma sessão padrão
        const defaultSession = { 
            id: 'default', 
            name: 'Minha Conexão',
            phoneNumber: "556784060135",
            useGemini: false,
            geminiPrompt: "Você é um assistente virtual prestativo para uma empresa. Responda de forma curta e profissional."
        };
        if (!fs.existsSync(SESSIONS_FILE)) {
            fs.writeFileSync(SESSIONS_FILE, JSON.stringify([defaultSession], null, 2));
        }
        return [defaultSession];
    };

    const saveSessionsMetadata = () => {
        try {
            const metadata = Array.from(sessions.values()).map(s => ({ 
                id: s.id, 
                name: s.name,
                phoneNumber: s.phoneNumber,
                useGemini: s.useGemini,
                geminiPrompt: s.geminiPrompt
            }));
            fs.writeFileSync(SESSIONS_FILE, JSON.stringify(metadata, null, 2));
        } catch (e) {
            console.error('Erro ao salvar metadados das sessões:', e);
        }
    };

    const getResponsesPath = (sessionId: string) => `responses.json`;
    const getAuthPath = (sessionId: string) => `auth_${sessionId}`;

    const loadResponses = (sessionId: string) => {
        const sessionPath = getResponsesPath(sessionId);
        if (fs.existsSync(sessionPath)) {
            try {
                const content = fs.readFileSync(sessionPath, 'utf-8');
                if (!content.trim()) return [...DEFAULT_RESPONSES];
                const responses = JSON.parse(content).map((r: any) => ({
                    ...r,
                    active: r.active !== undefined ? r.active : true
                }));
                // Deduplicar por ID
                return Array.from(new Map(responses.map((r: any) => [r.id, r])).values());
            } catch (e) {
                console.error(`[loadResponses] Erro ao ler respostas da sessão ${sessionId}:`, e);
            }
        }
        return [...DEFAULT_RESPONSES];
    };

    const saveResponses = (sessionId: string) => {
        const session = sessions.get(sessionId);
        if (!session) {
            console.error(`[saveResponses] Sessão ${sessionId} não encontrada para salvar respostas`);
            return;
        }
        try {
            // Deduplicar respostas por ID antes de salvar
            const uniqueResponses = Array.from(new Map(session.autoResponses.map(r => [r.id, r])).values());
            session.autoResponses = uniqueResponses;
            
            const responses = session.autoResponses;
            const sessionPath = getResponsesPath(sessionId);
            console.log(`[saveResponses] Salvando ${responses.length} respostas globalmente em ${sessionPath}`);
            fs.writeFileSync(sessionPath, JSON.stringify(responses, null, 2));
            
            // Também atualizamos a variável global para novas sessões
            DEFAULT_RESPONSES = [...responses];
            
            // Sincroniza todas as sessões ativas para que todas tenham as mesmas respostas
            for (const [sid, s] of sessions.entries()) {
                if (sid !== sessionId) {
                    s.autoResponses = [...responses];
                }
            }
            
            // Notifica todos os clientes para atualizarem suas listas de respostas
            io.emit('responses-updated', { responses });
            
            console.log(`[saveResponses] Respostas salvas e sincronizadas com sucesso.`);
        } catch (e) {
            console.error(`[saveResponses] Erro ao salvar respostas:`, e);
        }
    };

    const connectToWhatsApp = async (sessionId: string, reason: string = 'automatic') => {
        const session = sessions.get(sessionId);
        if (!session) return;

        // Lock para evitar múltiplas execuções simultâneas
        if ((session as any)._connectingLock) {
            console.log(`[${sessionId}] connectToWhatsApp já em execução. Ignorando chamada (motivo: ${reason}).`);
            return;
        }
        (session as any)._connectingLock = true;

        const connectionId = Date.now();
        session.lastConnectionAttempt = connectionId;
        let connectionTimeout: NodeJS.Timeout | undefined;

        try {
            // Verificar se estamos em período de cool-down por conflito
            const conflictDelay = session.conflictCount ? Math.min(60000 * Math.pow(2.5, session.conflictCount - 1), 1800000) : 60000;
            const now = Date.now();
            
            if (session.lastConflictTime && now - session.lastConflictTime < conflictDelay) {
                const remaining = Math.ceil((conflictDelay - (now - session.lastConflictTime)) / 1000);
                console.log(`[${sessionId}] Conexão ignorada (motivo: ${reason}). Aguardando cool-down de conflito (${remaining}s restantes, delay atual: ${conflictDelay/1000}s).`);
                (session as any)._connectingLock = false;
                return;
            }

            // Evitar reconexões muito frequentes (mínimo 10s entre tentativas)
            if (session.lastConnectionAttempt && now - session.lastConnectionAttempt < 10000 && 
                reason !== 'manual_reconnect' && reason !== 'logout_reconnect' && reason !== 'aggressive_reconnect') {
                console.log(`[${sessionId}] Conexão ignorada (motivo: ${reason}). Tentativa muito recente (${Math.round((now - session.lastConnectionAttempt)/1000)}s atrás).`);
                (session as any)._connectingLock = false;
                return;
            }

            if (session.isConnecting || (session.status === 'open' && session.sock)) {
                console.log(`Sessão ${sessionId} já conectada ou conectando (motivo: ${reason}). Pulando...`);
                (session as any)._connectingLock = false;
                return;
            }

            session.isConnecting = true;
            session.status = 'connecting';
            io.to(sessionId).emit('status', 'connecting');
            io.to(sessionId).emit('log', 'Iniciando tentativa de conexão...');

            // Safety timeout: reset isConnecting after 90 seconds if still stuck
            connectionTimeout = setTimeout(() => {
                if (session.isConnecting && session.status === 'connecting') {
                    console.log(`[${sessionId}] Timeout de conexão atingido (90s). Resetando estado.`);
                    session.isConnecting = false;
                    session.status = 'close';
                    (session as any)._connectingLock = false;
                    io.to(sessionId).emit('status', 'disconnected');
                    io.to(sessionId).emit('log', 'Timeout ao tentar conectar. Tente novamente.');
                }
            }, 90000);

            // Limpar listeners e socket anteriores IMEDIATAMENTE para evitar race conditions
            if (session.watchdogTimer) {
                clearInterval(session.watchdogTimer);
                session.watchdogTimer = undefined;
            }

            if (session.sock) {
                try {
                    console.log(`[${sessionId}] Limpando socket anterior (ID: ${session.lastConnectionAttempt}) antes de nova tentativa...`);
                    if (session.sock.ev && typeof session.sock.ev.removeAllListeners === 'function') {
                        session.sock.ev.removeAllListeners();
                    }
                    
                    if (session.sock.ws) {
                        try {
                            if (typeof session.sock.ws.terminate === 'function') {
                                session.sock.ws.terminate();
                            } else if (typeof session.sock.ws.close === 'function') {
                                session.sock.ws.close();
                            }
                        } catch (wsErr) {
                            console.log(`[${sessionId}] Erro ao fechar WS anterior:`, wsErr instanceof Error ? wsErr.message : String(wsErr));
                        }
                    }
                } catch (e) {
                    console.error(`[${sessionId}] Erro ao limpar socket anterior:`, e);
                }
                session.sock = null;
            }

            console.log(`Iniciando conexão para sessão: ${session.name} (${sessionId}) - Motivo: ${reason}...`);
            
            const authPath = getAuthPath(sessionId);
            console.log(`[${sessionId}] Caminho de autenticação: ${authPath}`);
            if (!fs.existsSync(authPath)) {
                console.log(`[${sessionId}] Criando pasta de autenticação...`);
                fs.mkdirSync(authPath, { recursive: true });
            }

            let authState;
            try {
                authState = await useMultiFileAuthState(authPath);
            } catch (authErr) {
                console.error(`[${sessionId}] Erro ao carregar estado de autenticação:`, authErr);
                // Se falhar ao carregar, a pasta pode estar corrompida. Tentar limpar.
                try {
                    if (fs.existsSync(authPath)) {
                        fs.rmSync(authPath, { recursive: true, force: true });
                        console.log(`[${sessionId}] Pasta de autenticação corrompida removida.`);
                    }
                } catch (rmErr) {
                    console.error(`[${sessionId}] Erro ao remover pasta corrompida:`, rmErr);
                }
                (session as any)._connectingLock = false;
                session.isConnecting = false;
                session.status = 'close';
                setTimeout(() => connectToWhatsApp(sessionId, 'auth_load_error_retry'), 10000);
                return;
            }
            const { state, saveCreds } = authState;
            
            // Pequeno delay para garantir que o sistema de arquivos esteja pronto
            await delay(1000);
            
            let version: [number, number, number] = [2, 3000, 1015901307]; // Versão fallback mais recente
            try {
                const latest = await fetchLatestBaileysVersion();
                version = latest.version;
                console.log(`[${sessionId}] Usando Baileys v${version.join('.')}`);
            } catch (err) {
                console.error(`[${sessionId}] Erro ao buscar versão do Baileys, usando fallback:`, err);
            }
            
            console.log(`[${sessionId}] Criando novo socket (ID: ${connectionId})...`);

            const sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
                },
                browser: ["Ubuntu", "Chrome", "122.0.6261.112"],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 120000,
                keepAliveIntervalMs: 10000, // Ping muito frequente (10s) para máxima persistência
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                qrTimeout: 120000,
                retryRequestDelayMs: 2000, // Tenta novamente mais rápido
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(
                        message.buttonsMessage ||
                        message.templateMessage ||
                        message.listMessage
                    );
                    if (requiresPatch) {
                        return {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadata: {},
                                        deviceListMetadataVersion: 2
                                    },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                }
            });

            // Watchdog para garantir que a sessão ativa não caia
            session.watchdogTimer = setInterval(async () => {
                if (session.status === 'open' && session.sock) {
                    try {
                        // Força o bot a aparecer online e mantém a conexão "quente"
                        await session.sock.sendPresenceUpdate('available');
                    } catch (e) {
                        console.error(`[${sessionId}] Watchdog detectou falha na conexão ativa. Forçando reconexão...`);
                        session.status = 'close';
                        session.isConnecting = false;
                        if (session.watchdogTimer) {
                            clearInterval(session.watchdogTimer);
                            session.watchdogTimer = undefined;
                        }
                        connectToWhatsApp(sessionId, 'watchdog_failure');
                    }
                }
            }, 60000); // Verifica a cada 60 segundos (mais equilibrado)

            session.sock = sock;

            sock.ev.on('creds.update', async () => {
                if (session.sock !== sock) return;
                try {
                    await saveCreds();
                } catch (err) {
                    console.error(`[${sessionId}] Erro ao salvar credenciais:`, err);
                    // Se o erro for de Bad MAC no saveCreds, a sessão está em estado terminal
                    if (err instanceof Error && (err.message.includes('Bad MAC') || err.message.includes('SessionError'))) {
                        console.error(`[${sessionId}] Erro crítico no saveCreds. Forçando fechamento para recuperação.`);
                        if (sock.ws) {
                            try { sock.ws.close(); } catch(e) {}
                        }
                    }
                }
            });

            sock.ev.on('connection.update', async (update: any) => {
                // Verificar se este evento pertence ao socket atual da sessão
                if (session.sock !== sock) {
                    console.log(`[${sessionId}] Ignorando atualização de conexão de um socket antigo (ID: ${connectionId}).`);
                    return;
                }

                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    try {
                        clearTimeout(connectionTimeout);
                        console.log(`[${sessionId}] QR Code recebido (ID: ${connectionId})...`);
                        session.qrCode = await QRCode.toDataURL(qr);
                        session.status = 'qr';
                        io.to(sessionId).emit('qr', session.qrCode);
                        io.to(sessionId).emit('status', 'qr');
                        io.to(sessionId).emit('log', 'QR Code gerado com sucesso!');
                        io.emit('sessions-updated');
                    } catch (err) {
                        console.error(`[${sessionId}] Erro ao converter QR Code (ID: ${connectionId}):`, err);
                        io.to(sessionId).emit('log', 'Erro ao processar QR Code.');
                    }
                }

                if (connection === 'close') {
                    (session as any)._connectingLock = false;
                    clearTimeout(connectionTimeout);
                    if (session.watchdogTimer) {
                        clearInterval(session.watchdogTimer);
                        session.watchdogTimer = undefined;
                    }
                    session.status = 'close';
                    session.isConnecting = false; // Resetar para permitir nova tentativa
                    // Não limpamos session.sock aqui para permitir que connectToWhatsApp faça o cleanup completo
                    io.emit('sessions-updated');
                    
                    const error = (lastDisconnect?.error as Boom);
                    const statusCode = error?.output?.statusCode;
                    const errorMessage = error?.message || '';
                    
                    // Erros de sessão/descriptografia críticos
                    const isSessionError = errorMessage.includes('Bad MAC') || 
                                         errorMessage.includes('SessionError') || 
                                         errorMessage.includes('No matching sessions') ||
                                         errorMessage.includes('Failed to decrypt message') ||
                                         errorMessage.includes('invalid-session') ||
                                         errorMessage.includes('disallowed') ||
                                         errorMessage.includes('unauthorized') ||
                                         errorMessage.includes('not-authorized') ||
                                         errorMessage.includes('Bad MAC') ||
                                         statusCode === 403 ||
                                         statusCode === 401;
                    
                    if (isSessionError) {
                        console.error(`[${sessionId}] Erro de sessão crítico detectado: ${errorMessage}. Limpando pasta de autenticação para forçar novo login.`);
                        io.to(sessionId).emit('log', '❌ Erro de criptografia detectado. Sua sessão pode estar corrompida. Limpando dados e reiniciando para novo login...');
                        
                        try {
                            const authPath = getAuthPath(sessionId);
                            if (fs.existsSync(authPath)) {
                                fs.rmSync(authPath, { recursive: true, force: true });
                                console.log(`[${sessionId}] Pasta de autenticação removida com sucesso.`);
                            }
                        } catch (rmErr) {
                            console.error(`[${sessionId}] Erro ao remover pasta de autenticação:`, rmErr);
                        }
                    }

                    // 440 é conflito (sessão aberta em outro lugar ou substituída)
                    const isConflict = statusCode === 440 || (errorMessage && errorMessage.toLowerCase().includes('conflict'));
                    
                    if (isConflict) {
                        session.lastConflictTime = Date.now();
                        session.conflictCount = (session.conflictCount || 0) + 1;
                        // Backoff mais agressivo para conflitos: 1m, 2.5m, 5.6m, 12.6m, 28m...
                        const nextDelay = Math.min(60000 * Math.pow(2.5, session.conflictCount - 1), 1800000); // Máximo 30 min
                        console.log(`[${sessionId}] Conflito de sessão detectado #${session.conflictCount} (ID: ${connectionId}). Aguardando ${Math.round(nextDelay/1000)}s.`);
                        io.to(sessionId).emit('log', `⚠️ Conflito de sessão #${session.conflictCount}. Outro dispositivo pode estar tentando conectar. Aguardando ${Math.round(nextDelay/1000)} segundos...`);
                        
                        if (session.conflictCount > 5) {
                            console.error(`[${sessionId}] Muitos conflitos detectados (${session.conflictCount}). Parando reconexão automática para evitar banimento.`);
                            io.to(sessionId).emit('log', '❌ Conflitos persistentes detectados. A reconexão automática foi pausada por 1 hora para sua segurança. Verifique se há outras instâncias do bot rodando.');
                            session.isConnecting = false;
                            session.status = 'close';
                            // Aumentar o tempo de espera drasticamente
                            session.lastConflictTime = Date.now() + 3600000; // 1 hora de "penalidade"
                            return;
                        }
                    }
                    
                    // AGRESSIVO: Reconectar em quase todos os casos, exceto logout explícito
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`[${sessionId}] Conexão fechada (ID: ${connectionId}). Motivo: ${statusCode}, Mensagem: ${errorMessage}, Reconectando: ${shouldReconnect}`);
                    
                    session.status = 'close';
                    session.qrCode = null;
                    session.pairingCode = null;
                    io.to(sessionId).emit('status', 'disconnected');
                    io.to(sessionId).emit('qr', null);
                    io.to(sessionId).emit('pairing-code', null);

                    if (shouldReconnect) {
                        const isRestartRequired = statusCode === 515 || 
                                               isSessionError ||
                                               (errorMessage && errorMessage.toLowerCase().includes('restart required')) || 
                                               (errorMessage && errorMessage.toLowerCase().includes('stream errored')) ||
                                               (errorMessage && errorMessage.toLowerCase().includes('connection lost')) ||
                                               (errorMessage && errorMessage.toLowerCase().includes('timed out')) ||
                                               (errorMessage && errorMessage.toLowerCase().includes('connection closed'));
                        
                        // Delay ultra-reduzido para reconexão instantânea
                        // Para erro 515 (Stream Errored), reconectamos IMEDIATAMENTE (100ms)
                        // Se falhar repetidamente, aumentamos o atraso gradualmente até 5s
                        const baseDelay = isRestartRequired ? 100 : 1000;
                        let delayTime = Math.min(baseDelay * (session.reconnectCount || 1), 5000);
                        
                        if (isConflict) {
                            // Delay maior para conflitos com backoff exponencial + jitter
                            const jitter = Math.random() * 30000; // 0-30s de variação
                            delayTime = Math.min(60000 * Math.pow(2.5, (session.conflictCount || 1) - 1), 1800000) + jitter;
                        } else if (isRestartRequired) {
                            // Jitter reduzido para erros que exigem reinício imediato (0-500ms)
                            delayTime += Math.random() * 500;
                        } else {
                            // Adicionar jitter também para outros erros (0-5s)
                            delayTime += Math.random() * 5000;
                        }
                        
                        session.reconnectCount = (session.reconnectCount || 0) + 1;
                        console.log(`[${sessionId}] Agendando reconexão #${session.reconnectCount} em ${Math.round(delayTime)}ms (Motivo: ${statusCode})...`);
                        
                        setTimeout(() => {
                            // Só reconecta se ainda estiver fechado
                            if (session.status === 'close') {
                                connectToWhatsApp(sessionId, 'aggressive_reconnect');
                            } else {
                                console.log(`[${sessionId}] Reconexão agendada ignorada: status=${session.status}`);
                            }
                        }, delayTime);
                    } else {
                        session.isConnecting = false;
                    }
                } else if (connection === 'open') {
                    (session as any)._connectingLock = false;
                    clearTimeout(connectionTimeout);
                    console.log(`[${sessionId}] Conexão aberta com sucesso (ID: ${connectionId})!`);
                    session.isConnecting = false;
                    session.status = 'open';
                    session.qrCode = null;
                    session.pairingCode = null;
                    session.reconnectCount = 0;
                    session.conflictCount = 0;
                    session.lastConflictTime = undefined;
                    session.phoneNumber = sock?.user?.id?.split(':')[0] || null;
                    saveSessionsMetadata();
                    console.log(`[${sessionId}] Número: ${session.phoneNumber}`);
                    io.to(sessionId).emit('status', 'connected');
                    io.to(sessionId).emit('log', 'WhatsApp conectado com sucesso!');
                    io.emit('sessions-updated');
                } else {
                    console.log(`[${sessionId}] Atualização de conexão (ID: ${connectionId}): ${connection}`);
                }
            });

            sock.ev.on('messages.upsert', async (m: any) => {
                if (session.sock !== sock) {
                    console.log(`[${sessionId}] Ignorando messages.upsert de um socket antigo (ID: ${connectionId}).`);
                    return;
                }
                if (session.status !== 'open') {
                    console.log(`[${sessionId}] Ignorando messages.upsert: status da sessão é ${session.status}.`);
                    return;
                }
                if (m.type !== 'notify') {
                    console.log(`[${sessionId}] Ignorando messages.upsert do tipo: ${m.type}`);
                    return;
                }
                
                for (const msg of m.messages) {
                    const msgId = msg.key.id;
                    if (!msgId) continue;
                    
                    console.log(`[${sessionId}] Processando mensagem ${msgId} (Status: ${session.status})`);
                    
                    if (session.processedMessages.has(msgId)) {
                        console.log(`[${sessionId}] Mensagem ${msgId} já processada.`);
                        continue;
                    }
                    
                    // Limitar tamanho do Set de mensagens processadas para evitar vazamento de memória
                    if (session.processedMessages.size > 2000) {
                        const it = session.processedMessages.values();
                        for (let i = 0; i < 500; i++) {
                            const val = it.next().value;
                            if (val) session.processedMessages.delete(val);
                            else break;
                        }
                    }
                    
                    const remoteJid = msg.key.remoteJid;
                    const fromMe = msg.key.fromMe;
                    const timestamp = msg.messageTimestamp;

                    const text = msg.message?.conversation || 
                                 msg.message?.extendedTextMessage?.text || 
                                 msg.message?.buttonsResponseMessage?.selectedButtonId || 
                                 msg.message?.imageMessage?.caption ||
                                 msg.message?.videoMessage?.caption ||
                                 msg.message?.documentMessage?.caption ||
                                 msg.message?.viewOnceMessage?.message?.imageMessage?.caption ||
                                 msg.message?.viewOnceMessage?.message?.videoMessage?.caption ||
                                 msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
                                 msg.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
                                 "";
                    
                    if (!text) {
                        session.processedMessages.add(msgId);
                        continue;
                    }

                    // Log the message if it's not from us
                    if (!fromMe) {
                        session.messageLog.push({
                            id: msgId,
                            remoteJid,
                            text,
                            fromMe,
                            timestamp,
                            responded: false,
                            retryCount: 0
                        });
                        // Keep log size manageable
                        if (session.messageLog.length > 500) session.messageLog.shift();
                    }

                    try {
                        await processMessage(msg);
                        session.processedMessages.add(msgId);
                    } catch (err) {
                        console.error(`[${sessionId}] Erro ao processar mensagem ${msgId}:`, err);
                    }
                }
            });

            const sendMessageWithButtons = async (jid: string, text: string, buttons: any[] | null, footer?: string) => {
                if (!session.sock || session.status !== 'open') {
                    console.log(`[${sessionId}] Erro ao enviar mensagem: Socket fechado ou não aberto.`);
                    return;
                }

                if (!text && (!buttons || buttons.length === 0)) {
                    console.log(`[${sessionId}] Ignorando mensagem vazia sem botões para ${jid}`);
                    return;
                }
                console.log(`[${sessionId}] Enviando mensagem para ${jid}: "${(text || "").substring(0, 50)}..." (Buttons: ${buttons ? buttons.length : 0})`);
                if (buttons && buttons.length > 0) {
                    // Try sending with buttons first
                    try {
                        await sock.sendMessage(jid, { 
                            text, 
                            buttons, 
                            footer: footer || 'Kabot Multi',
                            headerType: 1
                        } as any);
                    } catch (btnErr) {
                        console.error(`[${sessionId}] Erro ao enviar botões, tentando texto simples:`, btnErr);
                        // Fallback to plain text with button options appended
                        let plainText = text;
                        plainText += '\n\n' + buttons.map((b, i) => `*${i + 1}.* ${b.buttonText.displayText}`).join('\n');
                        await sock.sendMessage(jid, { text: plainText });
                    }
                } else {
                    await sock.sendMessage(jid, { text });
                }
            };

            const sendResponseWithMedia = async (jid: string, response: any, buttons: any[] | null, textOverride?: string) => {
                if (!session.sock || session.status !== 'open') {
                    console.log(`[${sessionId}] Erro ao enviar mídia: Socket fechado ou não aberto.`);
                    return;
                }

                const messageText = textOverride || response.message;
                if (response.mediaPath) {
                    // Resolve path correctly - if it's absolute, use it as is
                    const filePath = path.isAbsolute(response.mediaPath) ? response.mediaPath : path.join(process.cwd(), response.mediaPath);
                    
                    console.log(`[${sessionId}] Tentando enviar mídia: ${filePath} (Mime: ${response.mimeType})`);
                    
                    if (!fs.existsSync(filePath)) {
                        console.error(`[${sessionId}] Arquivo de mídia não encontrado: ${filePath}`);
                        await sendMessageWithButtons(jid, messageText, buttons);
                    } else {
                        try {
                            const buffer = fs.readFileSync(filePath);
                            let mimeType = response.mimeType || 'application/octet-stream';
                            
                            // Correção de mimeType para áudio se for genérico ou incorreto
                            if (response.mediaPath) {
                                const ext = path.extname(response.mediaPath).toLowerCase();
                                if (mimeType === 'application/octet-stream' || mimeType.startsWith('audio/')) {
                                    if (ext === '.mp3') mimeType = 'audio/mpeg';
                                    else if (ext === '.ogg' || ext === '.opus') mimeType = 'audio/ogg';
                                    else if (ext === '.m4a') mimeType = 'audio/mp4';
                                    else if (ext === '.wav') mimeType = 'audio/wav';
                                    else if (ext === '.aac') mimeType = 'audio/aac';
                                    else if (mimeType === 'application/octet-stream' && ['.mp3', '.ogg', '.opus', '.m4a', '.wav', '.aac'].some(e => ext === e)) {
                                        mimeType = 'audio/mpeg'; // Fallback
                                    }
                                }
                            }

                            const position = response.mediaPosition || 'top';
                            const sendAsCaption = response.sendAsCaption !== false;

                            console.log(`[${sessionId}] Enviando mídia tipo: ${mimeType}, Posição: ${position}`);

                            if (position === 'bottom') {
                                await sendMessageWithButtons(jid, messageText, buttons);
                                if (mimeType.startsWith('image/')) await sock.sendMessage(jid, { image: buffer, mimetype: mimeType });
                                else if (mimeType.startsWith('video/')) await sock.sendMessage(jid, { video: buffer, mimetype: mimeType });
                                else if (mimeType.startsWith('audio/')) {
                                    await sock.sendMessage(jid, { 
                                        audio: buffer, 
                                        mimetype: mimeType.includes('ogg') ? 'audio/ogg; codecs=opus' : 'audio/mp4', 
                                        ptt: true 
                                    });
                                }
                            } else {
                                if (sendAsCaption && (mimeType.startsWith('image/') || mimeType.startsWith('video/'))) {
                                    if (mimeType.startsWith('image/')) {
                                        await sock.sendMessage(jid, { 
                                            image: buffer, 
                                            caption: messageText, 
                                            mimetype: mimeType,
                                            buttons: buttons || undefined, 
                                            footer: buttons ? 'Kabot Multi' : undefined 
                                        } as any);
                                    } else {
                                        await sock.sendMessage(jid, { 
                                            video: buffer, 
                                            caption: messageText, 
                                            mimetype: mimeType,
                                            buttons: buttons || undefined, 
                                            footer: buttons ? 'Kabot Multi' : undefined 
                                        } as any);
                                    }
                                } else {
                                    if (mimeType.startsWith('image/')) await sock.sendMessage(jid, { image: buffer, mimetype: mimeType });
                                    else if (mimeType.startsWith('video/')) await sock.sendMessage(jid, { video: buffer, mimetype: mimeType });
                                    else if (mimeType.startsWith('audio/')) {
                                        await sock.sendMessage(jid, { 
                                            audio: buffer, 
                                            mimetype: mimeType.includes('ogg') ? 'audio/ogg; codecs=opus' : 'audio/mp4', 
                                            ptt: true 
                                        });
                                    }
                                    
                                    if (messageText) {
                                        await sendMessageWithButtons(jid, messageText, buttons);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error(`[${sessionId}] Erro ao enviar mídia:`, err);
                            await sendMessageWithButtons(jid, messageText, buttons);
                        }
                    }
                } else {
                    await sendMessageWithButtons(jid, messageText, buttons);
                }
            };

            const processMessage = async (msg: any) => {
                const msgId = msg.key.id;
                const remoteJid = msg.key.remoteJid;
                const fromMe = msg.key.fromMe;
                
                const text = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.buttonsResponseMessage?.selectedButtonId || 
                             msg.message?.imageMessage?.caption ||
                             msg.message?.videoMessage?.caption ||
                             msg.message?.documentMessage?.caption ||
                             msg.message?.viewOnceMessage?.message?.imageMessage?.caption ||
                             msg.message?.viewOnceMessage?.message?.videoMessage?.caption ||
                             msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
                             msg.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
                             "";

                if (!text) return;

                console.log(`[${sessionId}] Processando mensagem de ${remoteJid}: "${text}" (ID: ${msgId})`);

                try {
                    let matched = false;
                    for (const response of session.autoResponses) {
                        if (response.active === false) continue;
                        if (fromMe && !response.respondToSelf) continue;
                        if (!fromMe && remoteJid === 'status@broadcast') continue;

                        // Alterado para correspondência exata (100% igual) conforme solicitado pelo usuário
                        const triggerMatch = response.responseType === 'pix_api' 
                            ? (text === response.trigger || text.startsWith(response.trigger + ' '))
                            : (text === response.trigger);

                        if (triggerMatch) {
                            matched = true;
                            console.log(`[${sessionId}] Gatilho "${response.trigger}" correspondido...`);
                            
                            const buttons = response.buttons ? response.buttons.split(',').map((b: string) => ({
                                buttonId: b.trim(),
                                buttonText: { displayText: b.trim() },
                                type: 1
                            })) : null;

                            // Handle Pix API response
                            if (response.responseType === 'pix_api') {
                                const sender = msg.key.participant || msg.key.remoteJid || '';
                                const userId = sender.split('@')[0];
                                const uniqueTransactionId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
                                
                                let url = (response.pixApiUrl || DEFAULT_PIX_API_KEY || '').trim();
                                const triggerLower = response.trigger.toLowerCase();
                                const textLower = text.toLowerCase();
                                const triggerIndex = textLower.indexOf(triggerLower);
                                
                                let extractedValue = null;
                                if (triggerIndex !== -1) {
                                    const afterTrigger = text.substring(triggerIndex + triggerLower.length).trim();
                                    const match = afterTrigger.match(/(\d+([.,]\d{1,2})?)/);
                                    if (match) {
                                        const valStr = match[1].replace(',', '.');
                                        if (!isNaN(parseFloat(valStr))) {
                                            extractedValue = valStr;
                                        }
                                    }
                                }

                                if (!extractedValue) {
                                    await sendResponseWithMedia(remoteJid, response, buttons, `Para efetuar o pagamento, digite ${response.trigger} e o valor. Exemplo : ${response.trigger} 10`);
                                } else {
                                    let value = extractedValue;
                                    if (url.startsWith('sk_live_') || url.startsWith('sk_test_')) {
                                        const apiKey = url;
                                        const cpf = response.pixCpf || '';
                                        const numericValue = parseFloat(value);
                                        if (isNaN(numericValue) || numericValue < 10.0) value = "10.00";
                                        
                                        url = `https://easy-pix.com/createPix?apiKey=${apiKey}&value=${value}&user_id=${uniqueTransactionId}&customerid=${uniqueTransactionId}&original_user=${userId}&cpf=${cpf}`;
                                        const apiRes = await fetchWithRetry(url);
                                        
                                        if (apiRes.ok) {
                                            const data: any = await apiRes.json();
                                            const pixCode = data.code || data.pixCode || data.pix || data.payload;
                                            if (pixCode) {
                                                await sendResponseWithMedia(remoteJid, response, buttons, response.message || "Aqui está o seu código Pix para pagamento:");
                                                await sock.sendMessage(remoteJid, { text: pixCode });
                                            } else {
                                                console.error(`[${sessionId}] API Pix não retornou código. Dados:`, JSON.stringify(data));
                                                throw new Error("API Pix não retornou código");
                                            }
                                        } else {
                                            const errorMsg = `Erro API Pix: ${apiRes.status}`;
                                            if (apiRes.status === 502) {
                                                console.warn(`[${sessionId}] API Pix temporariamente indisponível (502). O verificador tentará novamente em breve.`);
                                            } else {
                                                console.error(`[${sessionId}] ${errorMsg}`);
                                            }
                                            throw new Error(errorMsg);
                                        }
                                    } else {
                                        // Custom API logic...
                                        const apiRes = await fetchWithRetry(url, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ phoneNumber: userId, value: value, sessionId })
                                        });
                                        if (apiRes.ok) {
                                            const data: any = await apiRes.json();
                                            const pixCode = data.pixCode || data.pix || data.payload;
                                            if (pixCode) {
                                                await sendResponseWithMedia(remoteJid, response, buttons, response.message || "Aqui está o seu código Pix:");
                                                await sock.sendMessage(remoteJid, { text: pixCode });
                                            }
                                        }
                                    }
                                }
                            } else {
                                await sendResponseWithMedia(remoteJid, response, buttons);
                            }
                        }
                    }

                    // If no keyword matched, try Gemini if enabled
                    if (!matched && session.useGemini && !fromMe && remoteJid !== 'status@broadcast') {
                        console.log(`[${sessionId}] Usando Gemini para responder...`);
                        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
                        if (!process.env.GEMINI_API_KEY) {
                            console.error(`[${sessionId}] GEMINI_API_KEY não configurada.`);
                            return;
                        }
                        const prompt = `${session.geminiPrompt}\n\nUsuário: ${text}\nAssistente:`;
                        const result = await ai.models.generateContent({
                            model: "gemini-3-flash-preview",
                            contents: prompt
                        });
                        const responseText = result.text;
                        if (responseText) {
                            if (session.status === 'open' && session.sock) {
                                await sock.sendMessage(remoteJid, { text: responseText });
                            } else {
                                console.log(`[${sessionId}] Socket fechado ao tentar enviar resposta Gemini. Agendando reconexão.`);
                                connectToWhatsApp(sessionId, 'send_failed_closed');
                            }
                        }
                    }

                    // Se chegamos aqui sem erro, marcamos como respondida (mesmo que não tenha gatilho)
                    if (!fromMe) {
                        const logEntry = session.messageLog.find(l => l.id === msgId);
                        if (logEntry) logEntry.responded = true;
                    }
                    
                    session.processedMessages.add(msgId);
                } catch (err) {
                    console.error(`[${sessionId}] Erro ao processar/responder mensagem ${msgId}:`, err);
                    // Não marcamos como respondida no log, permitindo que o verificador tente novamente
                    throw err; 
                }
            };

            // Add to session for background checker
            (session as any).processMessage = processMessage;

        } catch (err) {
            clearTimeout(connectionTimeout);
            session.isConnecting = false;
            (session as any)._connectingLock = false;
            console.error(`Erro crítico na sessão ${sessionId} (ID: ${connectionId}):`, err);
            io.to(sessionId).emit('log', `Erro crítico: ${err instanceof Error ? err.message : String(err)}`);
            setTimeout(() => connectToWhatsApp(sessionId, 'critical_error_retry'), 10000);
        }
    };

    // Initialize sessions
    const initialMetadata = loadSessionsMetadata();
    if (!fs.existsSync(SESSIONS_FILE)) {
        saveSessionsMetadata(); // Create the file if it doesn't exist
    }
    initialMetadata.forEach((m: any, index: number) => {
        try {
            sessions.set(m.id, {
                id: m.id,
                name: m.name,
                sock: null,
                qrCode: null,
                pairingCode: null,
                status: 'close',
                isConnecting: false,
                autoResponses: loadResponses(m.id),
                phoneNumber: m.phoneNumber || null,
                reconnectCount: 0,
                processedMessages: new Set<string>(),
                messageLog: [],
                userStates: new Map(),
                useGemini: m.useGemini || false,
                geminiPrompt: m.geminiPrompt || "Você é um assistente virtual prestativo para uma empresa. Responda de forma curta e profissional."
            });
            // Add a larger delay between initial connections to avoid rate limiting or high CPU
            // Also wait for the server to be fully ready
            setTimeout(() => connectToWhatsApp(m.id, 'startup'), 2000 + (index * 2000));
        } catch (e) {
            console.error(`Erro ao inicializar sessão ${m.id}:`, e);
        }
    });

    // API Routes
    app.get("/api/ping", (req, res) => {
        res.json({ status: "pong", timestamp: Date.now(), uptime: process.uptime() });
    });

    app.get("/api/sessions", (req, res) => {
        try {
            console.log(`[API] GET /api/sessions - Sessions count: ${sessions.size}`);
            const sessionList = Array.from(sessions.values()).map(s => ({
                id: s.id,
                name: s.name,
                status: s.status === 'open' ? 'connected' : 'disconnected',
                phoneNumber: s.phoneNumber
            }));
            res.json(sessionList);
        } catch (e) {
            console.error('[API] Erro ao listar sessões:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post("/api/sessions", (req, res) => {
        const { name } = req.body;
        const id = Date.now().toString();
        const newSession: Session = {
            id,
            name: name || `Conexão ${id}`,
            sock: null,
            qrCode: null,
            pairingCode: null,
            status: 'close',
            isConnecting: false,
            autoResponses: loadResponses(id),
            phoneNumber: null,
            reconnectCount: 0,
            processedMessages: new Set<string>(),
            messageLog: [],
            userStates: new Map(),
            useGemini: false,
            geminiPrompt: "Você é um assistente virtual prestativo para uma empresa. Responda de forma curta e profissional."
        };
        sessions.set(id, newSession);
        saveSessionsMetadata();
        connectToWhatsApp(id, 'new_session');
        io.emit('sessions-updated');
        res.json({ 
            id, 
            name: newSession.name, 
            status: 'disconnected',
            phoneNumber: null 
        });
    });

    const deleteSessionHandler = async (req: any, res: any) => {
        const { id } = req.params;
        const session = sessions.get(id);
        
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        console.log(`Excluindo sessão: ${session.name} (${id})`);

        // 1. Terminate socket and remove listeners
        if (session.sock) {
            try {
                session.sock.ev.removeAllListeners('connection.update');
                session.sock.ev.removeAllListeners('creds.update');
                session.sock.ev.removeAllListeners('messages.upsert');
                if (session.sock.ws) {
                    if (typeof session.sock.ws.terminate === 'function') {
                        session.sock.ws.terminate();
                    } else if (typeof session.sock.ws.close === 'function') {
                        session.sock.ws.close();
                    }
                }
            } catch (e) {
                console.error(`Erro ao fechar socket na exclusão da sessão ${id}:`, e);
            }
        }

        // 2. Delete files (with try-catch to avoid blocking the session removal from list)
        try {
            const authPath = getAuthPath(id);
            if (fs.existsSync(authPath)) {
                // Give a small delay to ensure file handles are released
                setTimeout(() => {
                    try {
                        fs.rmSync(authPath, { recursive: true, force: true });
                    } catch (err) {
                        console.error(`Erro tardio ao remover pasta de autenticação ${id}:`, err);
                    }
                }, 1000);
            }
        } catch (e) {
            console.error(`Erro ao tentar remover pasta de autenticação ${id}:`, e);
        }

        try {
            const respPath = getResponsesPath(id);
            if (fs.existsSync(respPath)) {
                fs.unlinkSync(respPath);
            }
        } catch (e) {
            console.error(`Erro ao remover arquivo de respostas ${id}:`, e);
        }

        // 3. Remove from memory and metadata
        sessions.delete(id);
        
        // Se deletou a última sessão, recria a padrão para não ficar vazio
        if (sessions.size === 0) {
            const defaultId = 'default';
            sessions.set(defaultId, {
                id: defaultId,
                name: 'Minha Conexão',
                sock: null,
                qrCode: null,
                pairingCode: null,
                status: 'close',
                isConnecting: false,
                autoResponses: loadResponses(defaultId),
                phoneNumber: null,
                reconnectCount: 0,
                processedMessages: new Set<string>(),
                messageLog: [],
                userStates: new Map(),
                useGemini: false,
                geminiPrompt: "Você é um assistente virtual prestativo para uma empresa. Responda de forma curta e profissional."
            });
        }
        
        saveSessionsMetadata();
        
        // 4. Notify all clients that sessions have changed
        io.emit('sessions-updated');
        
        res.json({ success: true });
    };

    app.delete("/api/sessions/:id", deleteSessionHandler);
    app.post("/api/sessions/:id/delete", deleteSessionHandler);

    app.get("/api/status/:sessionId", (req, res) => {
        const session = sessions.get(req.params.sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });
        res.json({ 
            status: session.status, 
            qr: session.qrCode,
            pairingCode: session.pairingCode,
            sessionName: session.name,
            phoneNumber: session.phoneNumber,
            useGemini: session.useGemini,
            geminiPrompt: session.geminiPrompt
        });
    });

    app.post("/api/settings/:sessionId", (req, res) => {
        const { sessionId } = req.params;
        const { useGemini, geminiPrompt } = req.body;
        const session = sessions.get(sessionId);
        if (session) {
            if (useGemini !== undefined) session.useGemini = useGemini;
            if (geminiPrompt !== undefined) session.geminiPrompt = geminiPrompt;
            saveSessionsMetadata();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Session not found" });
        }
    });

    app.post("/api/session/name/:sessionId", (req, res) => {
        const { sessionId } = req.params;
        const { name } = req.body;
        const session = sessions.get(sessionId);
        if (session && name) {
            session.name = name;
            saveSessionsMetadata();
            io.emit('sessions-updated');
            res.json({ success: true, name: session.name });
        } else {
            res.status(400).json({ error: "Invalid request" });
        }
    });

    app.post("/api/reconnect/:sessionId", async (req, res) => {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);
        if (session) {
            console.log(`[${sessionId}] Forçando reconexão solicitada pelo usuário...`);
            session.isConnecting = false;
            (session as any)._connectingLock = false;
            session.status = 'close';
            session.qrCode = null;
            session.pairingCode = null;
            connectToWhatsApp(sessionId, 'manual_reconnect');
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Session not found" });
        }
    });

    app.post("/api/disconnect/:sessionId", async (req, res) => {
        const session = sessions.get(req.params.sessionId);
        if (session) {
            if (session.sock && session.sock.ws) {
                if (typeof session.sock.ws.terminate === 'function') {
                    session.sock.ws.terminate();
                } else if (typeof session.sock.ws.close === 'function') {
                    session.sock.ws.close();
                }
            }
            session.sock = null;
            session.status = 'close';
            session.isConnecting = false;
            session.qrCode = null;
            session.pairingCode = null;
            io.to(session.id).emit('status', 'disconnected');
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Session not found" });
        }
    });

    app.post("/api/logout/:sessionId", async (req, res) => {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);
        if (session) {
            if (session.sock) {
                try { await session.sock.logout(); } catch (e) {}
            }
            const authPath = getAuthPath(sessionId);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
            session.qrCode = null;
            session.pairingCode = null;
            session.status = 'close';
            session.isConnecting = false;
            (session as any)._connectingLock = false;
            connectToWhatsApp(sessionId, 'logout_reconnect');
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Session not found" });
        }
    });

    app.post("/api/pair/:sessionId", async (req, res) => {
        const { sessionId } = req.params;
        const { phoneNumber } = req.body;
        const session = sessions.get(sessionId);
        if (!session || !session.sock) return res.status(500).json({ error: "Invalid session" });
        try {
            const code = await session.sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
            session.pairingCode = code;
            io.to(sessionId).emit('pairing-code', code);
            res.json({ code });
        } catch (error) {
            res.status(500).json({ error: "Failed to request pairing code" });
        }
    });

    app.get("/api/auto-responses/:sessionId", (req, res) => {
        const session = sessions.get(req.params.sessionId);
        res.json(session ? session.autoResponses : []);
    });

    const getOrCreateSession = (sessionId: string) => {
        let session = sessions.get(sessionId);
        if (!session && sessionId === 'default') {
            console.log(`[Session] Criando sessão default on-the-fly`);
            session = {
                id: 'default',
                name: 'Minha Conexão',
                sock: null,
                qrCode: null,
                pairingCode: null,
                status: 'close',
                isConnecting: false,
                autoResponses: loadResponses('default'),
                phoneNumber: null,
                reconnectCount: 0,
                processedMessages: new Set<string>(),
                messageLog: [],
                userStates: new Map(),
                useGemini: false,
                geminiPrompt: "Você é um assistente virtual prestativo para uma empresa. Responda de forma curta e profissional."
            };
            sessions.set('default', session);
            saveSessionsMetadata();
            io.emit('sessions-updated');
        }
        return session;
    };

    app.post("/api/auto-responses/:sessionId", upload.single('media'), (req, res) => {
        try {
            const { sessionId } = req.params;
            const { trigger, message, responseType, pixApiUrl, respondToSelf, mediaPosition, sendAsCaption, group } = req.body;
            
            console.log(`[POST /api/auto-responses/${sessionId}] Trigger: ${trigger}, Message: ${message}, Type: ${responseType}, Group: ${group}`);
            
            const session = getOrCreateSession(sessionId);

            if (!session) {
                console.error(`[POST /api/auto-responses/${sessionId}] Sessão não encontrada`);
                return res.status(404).json({ error: "Session not found" });
            }
            
            const newResponse = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                trigger: trigger || "",
                message: message || "",
                responseType: responseType || 'text',
                pixApiUrl: pixApiUrl || null,
                pixValue: "10.00",
                pixCpf: null,
                pixSeparateMessage: true,
                pixCopyButton: false,
                buttons: "",
                mediaPosition: mediaPosition || "top",
                respondToSelf: respondToSelf === 'true' || respondToSelf === true,
                sendAsCaption: sendAsCaption !== undefined ? (sendAsCaption === 'true' || sendAsCaption === true) : true,
                mediaPath: req.file ? req.file.path : null,
                mimeType: req.file ? req.file.mimetype : null,
                fileName: req.file ? req.file.originalname : null,
                active: true,
                group: group || "Padrão"
            };
            session.autoResponses.push(newResponse);
            saveResponses(sessionId);
            res.json(newResponse);
        } catch (error) {
            console.error(`[POST /api/auto-responses] Erro inesperado:`, error);
            res.status(500).json({ error: "Erro interno ao salvar autoresposta", details: error instanceof Error ? error.message : String(error) });
        }
    });

    const updateAutoResponse = (req: any, res: any) => {
        try {
            const { sessionId, id } = req.params;
            const { trigger, message, responseType, respondToSelf, pixApiUrl, mediaPosition, sendAsCaption, group, removeMedia } = req.body;
            
            console.log(`[UPDATE /api/auto-responses/${sessionId}/${id}] Method: ${req.method}, Trigger: ${trigger}, Type: ${responseType}, Group: ${group}, RemoveMedia: ${removeMedia}`);
            
            const session = getOrCreateSession(sessionId);
            if (!session) {
                console.error(`[UPDATE /api/auto-responses/${sessionId}/${id}] Sessão não encontrada`);
                return res.status(404).json({ error: "Session not found" });
            }

            const index = session.autoResponses.findIndex(r => r.id === id);
            if (index !== -1) {
                const old = session.autoResponses[index];
                
                // Se um novo arquivo foi enviado ou se foi solicitado a remoção, remove o antigo
                if ((req.file || removeMedia === 'true') && old.mediaPath && fs.existsSync(old.mediaPath)) {
                    try { fs.unlinkSync(old.mediaPath); } catch (e) { console.error('Erro ao remover arquivo antigo:', e); }
                }

                session.autoResponses[index] = {
                    ...old,
                    trigger: trigger !== undefined ? trigger : old.trigger,
                    message: message !== undefined ? message : old.message,
                    responseType: responseType || old.responseType,
                    pixApiUrl: pixApiUrl !== undefined ? pixApiUrl : old.pixApiUrl,
                    respondToSelf: respondToSelf !== undefined ? (respondToSelf === 'true' || respondToSelf === true) : old.respondToSelf,
                    mediaPosition: mediaPosition || old.mediaPosition || "top",
                    sendAsCaption: sendAsCaption !== undefined ? (sendAsCaption === 'true' || sendAsCaption === true) : (old.sendAsCaption !== false),
                    group: group !== undefined ? group : (old.group || "Padrão"),
                    // Só atualiza os campos de mídia se um novo arquivo foi enviado ou se foi solicitado a remoção
                    mediaPath: req.file ? req.file.path : (removeMedia === 'true' ? null : old.mediaPath),
                    mimeType: req.file ? req.file.mimetype : (removeMedia === 'true' ? null : old.mimeType),
                    fileName: req.file ? req.file.originalname : (removeMedia === 'true' ? null : old.fileName)
                };
                
                saveResponses(sessionId);
                res.json(session.autoResponses[index]);
            } else {
                console.error(`[UPDATE /api/auto-responses/${sessionId}/${id}] Resposta não encontrada`);
                res.status(404).json({ error: "Response not found" });
            }
        } catch (error) {
            console.error(`[UPDATE /api/auto-responses] Erro inesperado:`, error);
            res.status(500).json({ error: "Erro interno ao atualizar autoresposta", details: error instanceof Error ? error.message : String(error) });
        }
    };

    app.post("/api/auto-responses/:sessionId/:id", upload.single('media'), updateAutoResponse);
    app.put("/api/auto-responses/:sessionId/:id", upload.single('media'), updateAutoResponse);

    const deleteAutoResponse = (req: any, res: any) => {
        const { sessionId, id } = req.params;
        const session = getOrCreateSession(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const index = session.autoResponses.findIndex(r => r.id === id);
        if (index !== -1) {
            const resp = session.autoResponses[index];
            if (resp.mediaPath && fs.existsSync(resp.mediaPath)) {
                try { fs.unlinkSync(resp.mediaPath); } catch (e) { console.error('Erro ao remover arquivo:', e); }
            }
            session.autoResponses.splice(index, 1);
            saveResponses(sessionId);
        }
        res.json({ success: true });
    };

    app.delete("/api/auto-responses/:sessionId/:id", deleteAutoResponse);
    app.post("/api/auto-responses/:sessionId/:id/delete", deleteAutoResponse);

    const toggleAutoResponse = (req: any, res: any) => {
        const { sessionId, id } = req.params;
        const session = getOrCreateSession(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const index = session.autoResponses.findIndex(r => r.id === id);
        if (index !== -1) {
            session.autoResponses[index].active = !session.autoResponses[index].active;
            saveResponses(sessionId);
            res.json(session.autoResponses[index]);
        } else {
            res.status(404).json({ error: "Not found" });
        }
    };

    app.patch("/api/auto-responses/:sessionId/:id/toggle", toggleAutoResponse);
    app.post("/api/auto-responses/:sessionId/:id/toggle", toggleAutoResponse);

    app.post("/api/auto-responses/:sessionId/:id/duplicate", (req, res) => {
        try {
            const { sessionId, id } = req.params;
            const session = getOrCreateSession(sessionId);
            if (!session) return res.status(404).json({ error: "Session not found" });

            const original = session.autoResponses.find(r => r.id === id);
            if (!original) return res.status(404).json({ error: "Response not found" });

            let newMediaPath = null;
            if (original.mediaPath && fs.existsSync(original.mediaPath)) {
                try {
                    const ext = path.extname(original.mediaPath);
                    const newFileName = `${Date.now()}-copy${ext}`;
                    newMediaPath = path.join(UPLOADS_DIR, newFileName);
                    fs.copyFileSync(original.mediaPath, newMediaPath);
                } catch (e) {
                    console.error('Erro ao copiar arquivo na duplicação:', e);
                }
            }

            const duplicated = {
                ...original,
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                trigger: `${original.trigger} (Cópia)`,
                mediaPath: newMediaPath,
                fileName: newMediaPath ? original.fileName : null,
                mimeType: newMediaPath ? original.mimeType : null,
                active: true,
                group: original.group || "Padrão"
            };

            session.autoResponses.push(duplicated);
            saveResponses(sessionId);
            res.json(duplicated);
        } catch (error) {
            console.error(`[DUPLICATE /api/auto-responses] Erro inesperado:`, error);
            res.status(500).json({ error: "Erro interno ao duplicar autoresposta" });
        }
    });

    // 404 handler for API routes
    app.all("/api/*", (req, res) => {
        res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
    });

    // Global Error Handler to ensure JSON responses
    app.use((err: any, req: any, res: any, next: any) => {
        console.error(`[Global Error] ${req.method} ${req.url}:`, err);
        res.status(err.status || 500).json({ 
            error: err.message || "Erro interno do servidor",
            details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        });
    });

    // Socket.io connection
    io.on('connection', (socket) => {
        socket.on('heartbeat', () => {
            // Just to keep the connection active
        });
        socket.on('join-session', (sessionId) => {
            // Leave all other session rooms
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            });

            socket.join(sessionId);
            const session = sessions.get(sessionId);
            if (session) {
                socket.emit('status', session.status === 'open' ? 'connected' : 'disconnected');
                if (session.qrCode) socket.emit('qr', session.qrCode);
                if (session.pairingCode) socket.emit('pairing-code', session.pairingCode);
            }
        });
    });

    // Vite middleware
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // Global error handlers to prevent server crash
    process.on('uncaughtException', (err) => {
        console.error('CRITICAL: Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    // Keep-alive interval to prevent inactivity
    setInterval(() => {
        const activeSessions = Array.from(sessions.values()).filter(s => s.status === 'open').length;
        console.log(`[Keep-Alive] ${new Date().toISOString()} - Sessões Ativas: ${activeSessions}/${sessions.size}`);
        
        // Self-ping para evitar que o container entre em modo inativo
        const appUrl = process.env.APP_URL;
        if (appUrl) {
            fetch(`${appUrl}/api/health`).catch(() => {});
        }
    }, 60000);
}

startServer();
