let lockAudio: HTMLAudioElement | null = null;
let successAudio: HTMLAudioElement | null = null;
let hintAudio: HTMLAudioElement | null = null;

export function playLockSound(): void {
  try {
    if (!lockAudio) {
      lockAudio = new Audio('/sounds/lock.mp3');
      lockAudio.volume = 0.5;
    }
    
    // Reset and play
    lockAudio.currentTime = 0;
    lockAudio.play().catch(() => {
      // Graceful fallback if audio fails (e.g., autoplay restrictions)
      // Silently fail - audio is optional
    });
  } catch (error) {
    // Graceful fallback - audio is optional
  }
}

export function playSuccessSound(): void {
  try {
    if (!successAudio) {
      successAudio = new Audio('/sounds/success.mp3');
      successAudio.volume = 0.6;
    }

    successAudio.currentTime = 0;
    successAudio.play().catch(() => {
      // Graceful fallback - audio is optional
    });
  } catch (error) {
    // Graceful fallback - audio is optional
  }
}

export function playHintSound(): void {
  try {
    if (!hintAudio) {
      hintAudio = new Audio('/sounds/hint.mp3');
      hintAudio.volume = 0.6;
    }

    hintAudio.currentTime = 0;
    hintAudio.play().catch(() => {
      // Graceful fallback - audio is optional
    });
  } catch (error) {
    // Graceful fallback - audio is optional
  }
}
