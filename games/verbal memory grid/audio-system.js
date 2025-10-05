// Audio System for Verbal Memory Game
// Creates satisfying procedural sounds that match the game's design vibe

class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.soundEnabled = true;
    this.volume = 0.7;
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.soundEnabled = false;
    }
  }

  // Resume audio context on user interaction (required by browsers)
  resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Create a satisfying "correct" sound - bright and uplifting
  playCorrect() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Bright, ascending chord progression
    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
    oscillator.frequency.exponentialRampToValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Create a satisfying "incorrect" sound - deep and resonant
  playIncorrect() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Deep, descending tone
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
    oscillator.frequency.exponentialRampToValueAtTime(146.83, this.audioContext.currentTime + 0.3); // D3
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Create a satisfying "word spawn" sound - bassy bloopf
  playWordSpawn() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Bassy bloopf sound - starts low and drops even lower
    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime); // E2
    oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.15); // E1
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Create a satisfying "timer tick" sound - subtle and rhythmic
  playTimerTick() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Subtle, high-pitched tick
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    filter.type = 'highpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Create a satisfying "round complete" sound - triumphant and celebratory
  playRoundComplete() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Triumphant ascending scale
    oscillator.frequency.setValueAtTime(261.63, this.audioContext.currentTime); // C4
    oscillator.frequency.exponentialRampToValueAtTime(329.63, this.audioContext.currentTime + 0.15); // E4
    oscillator.frequency.exponentialRampToValueAtTime(392.00, this.audioContext.currentTime + 0.3); // G4
    oscillator.frequency.exponentialRampToValueAtTime(523.25, this.audioContext.currentTime + 0.45); // C5
    
    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.8);
  }

  // Create a satisfying "game over" sound - dramatic and final
  playGameOver() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Dramatic, descending tone
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.4); // A3
    oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.8); // A2
    
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 3;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1.2);
  }

  // Create a satisfying "strike" sound - sharp and attention-grabbing
  playStrike() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Sharp, dissonant tone
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 5;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Create a satisfying "score increase" sound - light and rewarding
  playScoreIncrease() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Light, ascending tone
    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
    
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Create a satisfying "hover" sound - subtle and responsive
  playHover() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Subtle, high-frequency tone
    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
    
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Toggle sound on/off
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  // Get current volume
  getVolume() {
    return this.volume;
  }

  // Check if sound is enabled
  isSoundEnabled() {
    return this.soundEnabled;
  }
}

// Global audio system instance
let audioSystem = null;

// Initialize audio system on first user interaction
function initAudioSystem() {
  if (!audioSystem) {
    audioSystem = new AudioSystem();
  }
  return audioSystem;
}
