
import React, { useEffect, useRef } from 'react';

interface AmbientSoundProps {
  isPlaying: boolean;
}

const AmbientSound: React.FC<AmbientSoundProps> = ({ isPlaying }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Function to initialize the audio engine
  const initAudio = () => {
    if (audioContextRef.current) return; // Already initialized

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0; // Start muted
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Create 3 oscillators for a chord/drone
    const freqs = [55, 110, 110.5]; // Deep drone with slight dissonance
    
    freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Individual gain for balance
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.15;
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        oscillatorsRef.current.push(osc);
    });

    // Add noise layer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.01; // Very subtle texture
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
  };

  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        initAudio();
      }
      // Resume context if suspended (browser autoplay policy)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Fade in
      if (masterGainRef.current && audioContextRef.current) {
         masterGainRef.current.gain.setTargetAtTime(0.3, audioContextRef.current.currentTime, 1);
      }
    } else {
      // Fade out
      if (masterGainRef.current && audioContextRef.current) {
         masterGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.5);
      }
    }
  }, [isPlaying]);

  return null; // Logic only component
};

export default AmbientSound;
