import { db } from './db';

type SoundType = 'success' | 'error' | 'delete' | 'restore' | 'goal';

class SoundService {
  private static instance: SoundService;
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private initialized = false;
  private soundEffectsEnabled = true;
  private lastPlayTime: Map<SoundType, number> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initListener();
      this.loadSettings();
    }
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private async loadSettings() {
    try {
      const settings = await db.settings.orderBy('id').first();
      if (settings && settings.soundEffects !== undefined) {
        this.soundEffectsEnabled = settings.soundEffects;
      }
      
      // Suscribirse a cambios en Dexie de forma rústica pero funcional
      // usando un interval o asumiendo que al cambiar el settings se actualiza en memoria.
      // Lo mejor es consultarlo on-the-fly si no es muy costoso, pero para audio 
      // lo mantenemos sincronizado al menos con la primera carga.
    } catch (e) {
      console.warn('Could not load sound settings', e);
    }
  }

  public async reloadSettings() {
    await this.loadSettings();
  }

  private initListener() {
    const handleFirstInteraction = () => {
      this.initializeSounds();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
  }

  private initializeSounds() {
    if (this.initialized) return;

    try {
      const soundFiles: Record<SoundType, string> = {
        success: '/sounds/success.wav',
        error: '/sounds/error.wav',
        delete: '/sounds/delete.wav',
        restore: '/sounds/restore.wav',
        goal: '/sounds/goal.wav'
      };

      for (const [type, path] of Object.entries(soundFiles)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 1.0; // max volume
        // Play and immediately pause to unlock in iOS
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {
          // Ignore abort errors caused by pausing
        });
        this.sounds.set(type as SoundType, audio);
        this.lastPlayTime.set(type as SoundType, 0);
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize sounds', error);
    }
  }

  public async play(type: SoundType) {
    if (!this.initialized) return;

    // Check config every time just to be safe, it's fast with Dexie
    try {
      const settings = await db.settings.orderBy('id').first();
      const enabled = settings?.soundEffects ?? true;
      if (!enabled) return;
    } catch {
      if (!this.soundEffectsEnabled) return;
    }

    const now = Date.now();
    const lastPlayed = this.lastPlayTime.get(type) || 0;
    
    // Debounce: prevent same sound from playing multiple times within 300ms
    if (now - lastPlayed < 300) return;

    const audio = this.sounds.get(type);
    if (audio) {
      try {
        // Reset time just in case
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch(e => {
            console.warn(`Audio play failed for ${type}:`, e);
          });
        }
        this.lastPlayTime.set(type, now);
      } catch (e) {
        console.warn(`Error playing ${type} sound:`, e);
      }
    }
  }
}

export const soundService = SoundService.getInstance();
