import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Disc, Droplets, Brain, Sparkles } from "lucide-react";

type SoundPreset = "brown" | "rain" | "binaural";

export default function FocusSoundGenerator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<SoundPreset>("brown");
  const [volume, setVolume] = useState(0.5);

  // Audio configuration states
  const [brownFilterFreq, setBrownFilterFreq] = useState(600); // Lowpass cutoff
  const [rainWindSpeed, setRainWindSpeed] = useState(0.15);    // LFO frequency for rainfall swell
  const [binauralBeatFreq, setBinauralBeatFreq] = useState(10); // Alpha wave: 10Hz
  const [binauralCarrierFreq, setBinauralCarrierFreq] = useState(150); // Carrier: 150Hz

  // Web Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Node Refs for active sound engine
  const activeSourcesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Custom Brown Noise Generator (Looping Buffer)
  const createBrownNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 4; // 4 seconds of unique noise
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // 1st-order filter to integrate white noise to brownian noise
      data[i] = (lastOut + (0.025 * white)) / 1.025;
      lastOut = data[i];
      data[i] *= 4.0; // Boost to nominal amplitude
    }
    return buffer;
  };

  // Pink Noise Generator for Rain Soundbase
  const createPinkNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.12; // Normalise
    }
    return buffer;
  };

  // Start the Audio Synth graph
  const startAudioEngine = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Recreate routing nodes
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.setValueAtTime(volume, ctx.currentTime);

      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 64;

      // Routing
      masterGainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);

      stopActiveSources();

      if (activePreset === "brown") {
        // Setup Warm Brown Noise Synthesis
        const buffer = createBrownNoiseBuffer(ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const lowpassFilter = ctx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.setValueAtTime(brownFilterFreq, ctx.currentTime);
        lowpassFilter.Q.setValueAtTime(1.0, ctx.currentTime);

        source.connect(lowpassFilter);
        lowpassFilter.connect(masterGainRef.current);

        source.start(0);
        activeSourcesRef.current = [source, lowpassFilter];

      } else if (activePreset === "rain") {
        // Setup Rain / Passing Wind Synthesis
        const buffer = createPinkNoiseBuffer(ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = "bandpass";
        bpFilter.frequency.setValueAtTime(500, ctx.currentTime);
        bpFilter.Q.setValueAtTime(0.8, ctx.currentTime);

        // LFO oscillator to modulate Rain filters to simulate shifting wind density
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(rainWindSpeed, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(180, ctx.currentTime); // Filter modulation range

        lfo.connect(lfoGain);
        lfoGain.connect(bpFilter.frequency);

        source.connect(bpFilter);
        bpFilter.connect(masterGainRef.current);

        lfo.start(0);
        source.start(0);
        activeSourcesRef.current = [source, bpFilter, lfo, lfoGain];

      } else if (activePreset === "binaural") {
        // Setup Brain Wave Binaural Beats
        const leftOsc = ctx.createOscillator();
        leftOsc.type = "sine";
        leftOsc.frequency.setValueAtTime(binauralCarrierFreq, ctx.currentTime);

        const rightOsc = ctx.createOscillator();
        rightOsc.type = "sine";
        // Right Frequency is carrier + beat frequency (e.g. 150 + 10 = 160 Hz)
        rightOsc.frequency.setValueAtTime(binauralCarrierFreq + binauralBeatFreq, ctx.currentTime);

        const leftPanner = ctx.createStereoPanner();
        leftPanner.pan.setValueAtTime(-1, ctx.currentTime); // Left ear only

        const rightPanner = ctx.createStereoPanner();
        rightPanner.pan.setValueAtTime(1, ctx.currentTime); // Right ear only

        leftOsc.connect(leftPanner);
        rightOsc.connect(rightPanner);

        leftPanner.connect(masterGainRef.current);
        rightPanner.connect(masterGainRef.current);

        leftOsc.start(0);
        rightOsc.start(0);
        activeSourcesRef.current = [leftOsc, rightOsc, leftPanner, rightPanner];
      }

      setIsPlaying(true);
      startVisualizer();
    } catch (e) {
      console.error("Failed to start procedural audio engine:", e);
    }
  };

  const stopActiveSources = () => {
    activeSourcesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
  };

  const stopAudioEngine = () => {
    stopActiveSources();
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActiveSources();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update parameters in real time when states change
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (activePreset === "brown" && activeSourcesRef.current[1]) {
      // Modify Lowpass Frequency
      const filter = activeSourcesRef.current[1] as BiquadFilterNode;
      filter.frequency.setTargetAtTime(brownFilterFreq, ctx.currentTime, 0.1);
    } else if (activePreset === "rain" && activeSourcesRef.current[2]) {
      // Modify LFO Speed (Rain wind density speed)
      const lfo = activeSourcesRef.current[2] as OscillatorNode;
      lfo.frequency.setTargetAtTime(rainWindSpeed, ctx.currentTime, 0.2);
    } else if (activePreset === "binaural") {
      // Modify Binaural beats oscillators
      const leftOsc = activeSourcesRef.current[0] as OscillatorNode;
      const rightOsc = activeSourcesRef.current[1] as OscillatorNode;
      if (leftOsc && rightOsc) {
        leftOsc.frequency.setTargetAtTime(binauralCarrierFreq, ctx.currentTime, 0.1);
        rightOsc.frequency.setTargetAtTime(binauralCarrierFreq + binauralBeatFreq, ctx.currentTime, 0.1);
      }
    }
  }, [brownFilterFreq, rainWindSpeed, binauralBeatFreq, binauralCarrierFreq, isPlaying, activePreset]);

  // Adjust volume
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Re-synth audio on preset toggle if already playing
  useEffect(() => {
    if (isPlaying) {
      startAudioEngine();
    }
  }, [activePreset]);

  // Dynamic wave animation visualizer on Canvas
  const startVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderWave = () => {
      animationFrameRef.current = requestAnimationFrame(renderWave);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;

      // Draw active fluid multi-gradient waves
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "rgba(96, 165, 250, 0.6)"); // Blue
      grad.addColorStop(0.5, "rgba(167, 139, 250, 0.9)"); // Purple
      grad.addColorStop(1, "rgba(52, 211, 153, 0.6)"); // Emerald

      ctx.strokeStyle = grad;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Subtle background wave glow
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(167, 139, 250, 0.3)";
    };

    renderWave();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioEngine();
    } else {
      startAudioEngine();
    }
  };

  // Helper text to describe active state
  const getPresetDescription = () => {
    switch (activePreset) {
      case "brown":
        return `Warm acoustic blanket. Attenuated frequencies to block out harsh background sounds and ADHD distractions. Current cutoff: ${brownFilterFreq}Hz`;
      case "rain":
        return `Organic rainfall & dynamic rustling breeze synthesized using procedural pink noise. LFO Speed: ${(rainWindSpeed * 60).toFixed(0)} swells/min`;
      case "binaural":
        return `Neuroscience frequency: ${binauralBeatFreq}Hz ${binauralBeatFreq >= 8 && binauralBeatFreq <= 12 ? "Alpha Wave (Focus)" : binauralBeatFreq >= 4 && binauralBeatFreq < 8 ? "Theta Wave (Flow)" : "Delta Wave (Deep Sleep)"} overlaying a ${binauralCarrierFreq}Hz carrier. Wearing headphones is recommended.`;
    }
  };

  return (
    <div className="w-full mt-6 pt-5 border-t border-white/10 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3.5">
        <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-blue-200/90 font-display">
          PROCEDURAL AUDIO CAPABILITY
        </span>
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4">
        <button
          onClick={() => setActivePreset("brown")}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border text-[11px] font-bold transition-all ${
            activePreset === "brown"
              ? "bg-white text-blue-900 border-white"
              : "bg-white/5 text-blue-100 hover:bg-white/10 border-white/10"
          }`}
        >
          <Disc className={`w-4 h-4 ${activePreset === "brown" && isPlaying ? "animate-spin" : ""}`} />
          <span>Brown Noise</span>
        </button>

        <button
          onClick={() => setActivePreset("rain")}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border text-[11px] font-bold transition-all ${
            activePreset === "rain"
              ? "bg-white text-blue-900 border-white"
              : "bg-white/5 text-blue-100 hover:bg-white/10 border-white/10"
          }`}
        >
          <Droplets className={`w-4 h-4 ${activePreset === "rain" && isPlaying ? "animate-bounce" : ""}`} />
          <span>Rainfall</span>
        </button>

        <button
          onClick={() => setActivePreset("binaural")}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border text-[11px] font-bold transition-all ${
            activePreset === "binaural"
              ? "bg-white text-blue-900 border-white"
              : "bg-white/5 text-blue-100 hover:bg-white/10 border-white/10"
          }`}
        >
          <Brain className={`w-4 h-4 ${activePreset === "binaural" && isPlaying ? "scale-110" : ""}`} />
          <span>Neuro Beats</span>
        </button>
      </div>

      {/* Description */}
      <p className="text-[10px] leading-relaxed text-blue-200/70 text-center max-w-xs min-h-[40px] mb-4">
        {getPresetDescription()}
      </p>

      {/* Custom synthesiser parameters tweaking sliders */}
      <div className="w-full max-w-xs space-y-3 bg-white/5 border border-white/5 p-3 rounded-2xl mb-4">
        {activePreset === "brown" && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-blue-200">
              <span>Warm Filter Cutoff</span>
              <span className="font-mono">{brownFilterFreq} Hz</span>
            </div>
            <input
              type="range"
              min="150"
              max="1500"
              step="10"
              value={brownFilterFreq}
              onChange={(e) => setBrownFilterFreq(Number(e.target.value))}
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}

        {activePreset === "rain" && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-blue-200">
              <span>Wind Swell Speed</span>
              <span className="font-mono">{(rainWindSpeed * 60).toFixed(0)} BPM</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={rainWindSpeed}
              onChange={(e) => setRainWindSpeed(Number(e.target.value))}
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}

        {activePreset === "binaural" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-blue-200">
                <span>Beat Frequency (L-R Delta)</span>
                <span className="font-mono">{binauralBeatFreq} Hz</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="0.5"
                value={binauralBeatFreq}
                onChange={(e) => setBinauralBeatFreq(Number(e.target.value))}
                className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-blue-200">
                <span>Carrier Frequency (Tone pitch)</span>
                <span className="font-mono">{binauralCarrierFreq} Hz</span>
              </div>
              <input
                type="range"
                min="80"
                max="250"
                step="5"
                value={binauralCarrierFreq}
                onChange={(e) => setBinauralCarrierFreq(Number(e.target.value))}
                className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        )}

        {/* Volume slider */}
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-bold text-blue-200">
            <span className="flex items-center gap-1">
              {volume === 0 ? <VolumeX className="w-3 h-3 text-red-300" /> : <Volume2 className="w-3 h-3" />}
              Volume
            </span>
            <span className="font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
        </div>
      </div>

      {/* Visualizer canvas */}
      <div className="relative w-full max-w-xs h-10 bg-white/5 border border-white/5 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
        {!isPlaying && (
          <span className="absolute text-[9px] font-bold tracking-widest uppercase text-blue-200/50">
            SOUNDSCAPE ENGINE READY
          </span>
        )}
        <canvas
          ref={canvasRef}
          width={320}
          height={40}
          className="w-full h-full block"
        />
      </div>

      {/* Primary control button */}
      <button
        id="sound-board-toggle-btn"
        onClick={handleTogglePlay}
        className={`w-full max-w-xs py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
          isPlaying
            ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/20"
            : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/20"
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            Pause Audio Loop
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            Synthesize Soundscape
          </>
        )}
      </button>
    </div>
  );
}
