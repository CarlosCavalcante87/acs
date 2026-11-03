import { BaseDados, Cidadao, PerfilACS, HistoricoItem } from '../types';

const DB_NAME = 'guia-tacs-v2';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

class IDBStorage {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return reject(new Error('IndexedDB não suportado'));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback para localStorage
      try {
        const item = localStorage.getItem(`acs_${key}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback para localStorage
      try {
        localStorage.setItem(`acs_${key}`, JSON.stringify(value));
      } catch (err) {
        console.error('Storage error:', err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        localStorage.removeItem(`acs_${key}`);
      } catch {}
    }
  }
}

export const idb = new IDBStorage();

// Request storage persistence so mobile OS doesn't evict offline records
export async function solicitarPersistencia(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

// ==========================================
// Criptografia Web Crypto (AES-GCM + PBKDF2)
// Para senhas do app e arquivos de backup protegidos
// ==========================================

export async function derivarChave(senha: string, sal: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(senha),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: sal as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function criptografarDados(texto: string, senha: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chave = await derivarChave(senha, sal);
  const enc = new TextEncoder();
  const cifrado = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chave,
    enc.encode(texto)
  );

  const pacote = {
    versao: 2,
    alg: 'AES-GCM-PBKDF2-100K',
    sal: Array.from(sal),
    iv: Array.from(iv),
    dados: Array.from(new Uint8Array(cifrado))
  };

  return JSON.stringify(pacote);
}

export async function descriptografarDados(jsonStr: string, senha: string): Promise<string> {
  const pacote = JSON.parse(jsonStr);
  if (!pacote.sal || !pacote.iv || !pacote.dados) {
    throw new Error('Arquivo de backup inválido ou não cifrado');
  }

  const sal = new Uint8Array(pacote.sal);
  const iv = new Uint8Array(pacote.iv);
  const dados = new Uint8Array(pacote.dados);
  const chave = await derivarChave(senha, sal);

  const decifrado = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    chave,
    dados
  );

  const dec = new TextDecoder();
  return dec.decode(decifrado);
}

// Chaves para controle de bloqueio de tela
export const PIN_STORAGE_KEY = 'guia_tacs_pin_hash';
export const PIN_SALT_KEY = 'guia_tacs_pin_salt';

export async function hashSenhaApp(senha: string): Promise<string> {
  let salStr = localStorage.getItem(PIN_SALT_KEY);
  let sal: Uint8Array;
  if (!salStr) {
    sal = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(PIN_SALT_KEY, JSON.stringify(Array.from(sal)));
  } else {
    sal = new Uint8Array(JSON.parse(salStr));
  }
  const enc = new TextEncoder();
  const senhaBytes = enc.encode(senha);
  const combinado = new Uint8Array(senhaBytes.length + sal.length);
  combinado.set(senhaBytes, 0);
  combinado.set(sal, senhaBytes.length);
  const buffer = await crypto.subtle.digest('SHA-256', combinado);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verificarSenhaApp(senhaDigitada: string): Promise<boolean> {
  const hashSalvo = localStorage.getItem(PIN_STORAGE_KEY);
  if (!hashSalvo) return true; // sem senha
  const hashCalc = await hashSenhaApp(senhaDigitada);
  return hashCalc === hashSalvo;
}
