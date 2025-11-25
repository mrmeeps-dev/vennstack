let lockAudio: HTMLAudioElement | null = null;

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
      console.log('Audio playback failed');
    });
  } catch (error) {
    // Graceful fallback
    console.log('Audio initialization failed:', error);
  }
}




