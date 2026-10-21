// Web Audio API Audio Chime Synthesizer & Browser Desktop Notification Helper

let isSoundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
  try {
    localStorage.setItem('lims_sound_enabled', enabled ? 'true' : 'false');
  } catch {}
}

export function getSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem('lims_sound_enabled');
    if (stored !== null) {
      isSoundEnabled = stored === 'true';
    }
  } catch {}
  return isSoundEnabled;
}

/**
 * Synthesizes a high-fidelity laboratory notification chime using Web Audio API.
 * Guaranteed to work offline and without any external audio file dependencies.
 */
export function playNotificationChime(type: 'new_request' | 'stat' | 'success' | 'info' = 'new_request') {
  if (!getSoundEnabled()) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === 'stat') {
      // 3-tone urgent alert (A5 880Hz -> C6 1046.5Hz -> E6 1318.5Hz)
      const freqs = [880, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } else if (type === 'new_request') {
      // Pleasant bright medical intake chime (C5 523.25Hz -> G5 783.99Hz -> C6 1046.5Hz)
      const notes = [
        { f: 523.25, start: 0, dur: 0.22, vol: 0.14 },
        { f: 783.99, start: 0.1, dur: 0.28, vol: 0.16 },
        { f: 1046.5, start: 0.22, dur: 0.5, vol: 0.2 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, now + n.start);
        gain.gain.setValueAtTime(n.vol, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur);
      });
    } else {
      // Gentle two-tone success confirmation (F5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.16, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('Audio playback omitted:', e);
  }
}

/**
 * Triggers native HTML5 Browser/OS Desktop Notification
 */
export function triggerDesktopNotification(
  title: string, 
  body: string, 
  onClick?: () => void
) {
  try {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      if (onClick) {
        n.onclick = () => {
          window.focus();
          onClick();
          n.close();
        };
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const n = new Notification(title, { body, icon: '/favicon.ico' });
          if (onClick) {
            n.onclick = () => {
              window.focus();
              onClick();
              n.close();
            };
          }
        }
      });
    }
  } catch (e) {
    console.warn('Desktop notification omitted:', e);
  }
}
