const SOUND_STORAGE_KEY = "cubo.terminal.sound";
const DEFAULT_SOUND_CONFIG = {
  soundEnabled: true,
  soundVolume: 0.35
};

let audioContext = null;

function readSoundConfig() {
  try {
    const storedConfig = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return {
      ...DEFAULT_SOUND_CONFIG,
      ...(storedConfig ? JSON.parse(storedConfig) : {})
    };
  } catch {
    return DEFAULT_SOUND_CONFIG;
  }
}

function saveSoundConfig(config) {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Sound preferences are non-critical in kiosk mode.
  }
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) {
    return null;
  }

  audioContext = new Context();
  return audioContext;
}

function clampVolume(volume) {
  const numericVolume = Number(volume);
  if (Number.isNaN(numericVolume)) {
    return DEFAULT_SOUND_CONFIG.soundVolume;
  }

  return Math.min(1, Math.max(0, numericVolume));
}

/**
 * Plays a short synthesized tone without external audio assets.
 */
function playTone({ frequency, duration, volume = getSoundVolume(), type = "square" }) {
  try {
    if (!isSoundEnabled()) {
      return;
    }

    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const durationSeconds = duration / 1000;
    const targetVolume = clampVolume(volume);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(targetVolume, 0.0001), startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.02);
  } catch {
    // Audio feedback must never block attendance flows.
  }
}

function playSequence(sequence) {
  try {
    if (!isSoundEnabled()) {
      return;
    }

    let delayMs = 0;
    sequence.forEach((step) => {
      if (step.pause) {
        delayMs += step.pause;
        return;
      }

      window.setTimeout(() => playTone(step), delayMs);
      delayMs += step.duration;
    });
  } catch {
    // Audio feedback must remain best-effort.
  }
}

export function playButtonBeep() {
  playTone({ frequency: 800, duration: 60, volume: getSoundVolume() * 0.85 });
}

export function playSuccessBeep() {
  playTone({ frequency: 1000, duration: 450, volume: getSoundVolume() });
}

export function playOfflineBeep() {
  playSequence([
    { frequency: 700, duration: 180 },
    { pause: 120 },
    { frequency: 700, duration: 180 }
  ]);
}

export function playErrorBeep() {
  playSequence([
    { frequency: 380, duration: 120 },
    { pause: 90 },
    { frequency: 380, duration: 120 },
    { pause: 90 },
    { frequency: 380, duration: 120 }
  ]);
}

export function playAdminEnterBeep() {
  playSequence([
    { frequency: 700, duration: 80 },
    { pause: 70 },
    { frequency: 1000, duration: 100 }
  ]);
}

export function playAdminExitBeep() {
  playTone({ frequency: 600, duration: 120, volume: getSoundVolume() * 0.9 });
}

export function playSyncSuccessBeep() {
  playSequence([
    { frequency: 1100, duration: 90 },
    { pause: 70 },
    { frequency: 1100, duration: 90 }
  ]);
}

export function playSyncErrorBeep() {
  playErrorBeep();
}

export function setSoundEnabled(enabled) {
  const config = readSoundConfig();
  saveSoundConfig({
    ...config,
    soundEnabled: Boolean(enabled)
  });
}

export function isSoundEnabled() {
  return readSoundConfig().soundEnabled !== false;
}

export function setSoundVolume(volume) {
  const config = readSoundConfig();
  saveSoundConfig({
    ...config,
    soundVolume: clampVolume(volume)
  });
}

export function getSoundVolume() {
  return clampVolume(readSoundConfig().soundVolume);
}
