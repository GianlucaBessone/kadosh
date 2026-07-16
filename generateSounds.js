const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'public', 'sounds');

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Simple WAV generator function (PCM 16-bit mono 44.1kHz)
function generateWav(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Write samples
  for (let i = 0; i < samples.length; i++) {
    // clamp between -32768 and 32767
    let s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  
  return buffer;
}

function createSuccess() {
  const sampleRate = 44100;
  const durationMs = 250;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const f1 = 800; // note 1
    const f2 = 1200; // note 2 (starts after 100ms)
    
    let s = 0;
    if (t < 0.15) {
      s += Math.sin(2 * Math.PI * f1 * t) * Math.exp(-t * 40);
    }
    if (t >= 0.1) {
      const t2 = t - 0.1;
      s += Math.sin(2 * Math.PI * f2 * t2) * Math.exp(-t2 * 30);
    }
    samples[i] = s * 0.2;
  }
  return generateWav(samples);
}

function createError() {
  const sampleRate = 44100;
  const durationMs = 300;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // lower frequency buzz/pop
    samples[i] = (Math.sin(2 * Math.PI * 150 * t) + Math.sin(2 * Math.PI * 200 * t)) * Math.exp(-t * 20) * 0.15;
  }
  return generateWav(samples);
}

function createDelete() {
  const sampleRate = 44100;
  const durationMs = 200;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // descending pitch
    const freq = 400 - (t * 1000); 
    samples[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.2;
  }
  return generateWav(samples);
}

function createRestore() {
  const sampleRate = 44100;
  const durationMs = 200;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // ascending pitch
    const freq = 200 + (t * 1500); 
    samples[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.2;
  }
  return generateWav(samples);
}

function createGoal() {
  const sampleRate = 44100;
  const durationMs = 600;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Arpeggio
    let s = 0;
    if (t > 0) s += Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 20); // A4
    if (t > 0.1) s += Math.sin(2 * Math.PI * 554.37 * (t-0.1)) * Math.exp(-(t-0.1) * 20); // C#5
    if (t > 0.2) s += Math.sin(2 * Math.PI * 659.25 * (t-0.2)) * Math.exp(-(t-0.2) * 20); // E5
    if (t > 0.3) s += Math.sin(2 * Math.PI * 880 * (t-0.3)) * Math.exp(-(t-0.3) * 15); // A5
    samples[i] = s * 0.15;
  }
  return generateWav(samples);
}

fs.writeFileSync(path.join(soundsDir, 'success.wav'), createSuccess());
fs.writeFileSync(path.join(soundsDir, 'error.wav'), createError());
fs.writeFileSync(path.join(soundsDir, 'delete.wav'), createDelete());
fs.writeFileSync(path.join(soundsDir, 'restore.wav'), createRestore());
fs.writeFileSync(path.join(soundsDir, 'goal.wav'), createGoal());

console.log('Sounds generated successfully in public/sounds');
