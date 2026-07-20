let audioContext = null;

export async function prepareReminder() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !audioContext) audioContext = new AudioContext();
    if (audioContext?.state === 'suspended') await audioContext.resume();
  } catch {
    // 权限被拒绝时仍保留页面内提醒。
  }
}

function playTone(frequency, start, duration) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function notifyTimerComplete({ title, body }) {
  try {
    if (audioContext?.state === 'suspended') audioContext.resume();
    const now = audioContext?.currentTime || 0;
    playTone(660, now, 0.28);
    playTone(880, now + 0.34, 0.42);

    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification(title, { body, tag: 'timegarden-timer', renotify: true });
    }

    const originalTitle = document.title;
    document.title = `⏰ ${title}`;
    window.setTimeout(() => {
      if (document.title === `⏰ ${title}`) document.title = originalTitle;
    }, 15000);
  } catch {
    // 页面提示仍会由调用方展示。
  }
}
