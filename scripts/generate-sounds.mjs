/**
 * Generates short UI sound effects (44.1 kHz 16-bit mono WAV) for EBYFIT.
 * Pure Node.js DSP — no dependencies. Run: node scripts/generate-sounds.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "sounds");
mkdirSync(OUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

/** Sine with exponential frequency glide. */
function sweep(samples, f0, f1, decay, harmonics = 0) {
  const out = new Float64Array(samples);
  let phase = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const freq = f0 * Math.pow(f1 / f0, t);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = Math.exp(-decay * i);
    let v = Math.sin(phase);
    if (harmonics > 0) v += 0.35 * Math.sin(2 * phase) * env;
    if (harmonics > 1) v += 0.18 * Math.sin(3 * phase) * env;
    out[i] = v * env;
  }
  return out;
}

/** Sum of two independent exponential-decay partials (e.g. bell-like). */
function dual(samples, f0, d0, f1, d1) {
  const out = new Float64Array(samples);
  let p0 = 0;
  let p1 = 0;
  for (let i = 0; i < samples; i++) {
    p0 += (2 * Math.PI * f0) / SAMPLE_RATE;
    p1 += (2 * Math.PI * f1) / SAMPLE_RATE;
    out[i] = Math.sin(p0) * Math.exp(-d0 * i) + 0.5 * Math.sin(p1) * Math.exp(-d1 * i);
  }
  return out;
}

/** Filtered noise burst — used for whooshes and tick transients. */
function noise(samples, decay, lp = 1, hp = 0) {
  const out = new Float64Array(samples);
  let last = 0;
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const input = Math.random() * 2 - 1;
    last = last + lp * (input - last); // one-pole low-pass
    const high = input - prevIn + 0.995 * prevOut; // one-pole high-pass
    prevIn = input;
    prevOut = high;
    const body = hp > 0 ? high : last;
    out[i] = body * Math.exp(-decay * i) * (1 - t * 0.3);
  }
  return out;
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.samples.length + (p.at ?? 0)));
  const out = new Float64Array(len);
  for (const { samples, at = 0, gain = 1 } of parts) {
    for (let i = 0; i < samples.length; i++) {
      if (at + i < len) out[at + i] += samples[i] * gain;
    }
  }
  return out;
}

function trim(buffer) {
  // Find the last sample above a low floor, then keep a short release tail.
  const floor = 0.01;
  let end = buffer.length - 1;
  while (end > 0 && Math.abs(buffer[end]) < floor) end--;
  const tail = Math.min(buffer.length - end, Math.floor(SAMPLE_RATE * 0.06));
  return buffer.subarray(0, Math.min(buffer.length, end + tail));
}

function encodeWav(name, float32) {
  const data = Buffer.alloc(float32.length * 2);
  for (let i = 0; i < float32.length; i++) {
    const v = Math.max(-1, Math.min(1, float32[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(OUT_DIR, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`✓ ${name}.wav (${(float32.length / SAMPLE_RATE).toFixed(2)}s)`);
}

const sr = SAMPLE_RATE;
const S = (ms) => Math.round((ms / 1000) * sr);

// Tap: tight, satisfying UI tick.
encodeWav("tap", trim(noise(S(70), 0.0016, 0.25, 1), 0.002));

// Select: quick two-note rise, confident.
encodeWav(
  "select",
  trim(mix({ samples: sweep(S(150), 620, 640, 0.0022), gain: 0.9 }, { samples: sweep(S(200), 920, 950, 0.0035), at: S(45), gain: 0.5 })),
);

// Toggle: bright mechanical-ish flick.
encodeWav(
  "toggle",
  trim(mix({ samples: noise(S(40), 0.003, 0.4, 1), gain: 0.5 }, { samples: sweep(S(140), 880, 900, 0.003), at: S(20) })),
);

// Success: rising major arpeggio (C6–E6–G6) with bell overtones.
encodeWav(
  "success",
  trim(
    mix(
      { samples: sweep(S(420), 1046, 1050, 0.0018, 1) },
      { samples: sweep(S(420), 1318, 1322, 0.0018, 1), at: S(90) },
      { samples: dual(S(700), 1568, 0.00085, 3136, 0.003), at: S(180), gain: 0.9 },
    ),
  ),
);

// Streak: celebratory flourish — arpeggio + sparkle.
encodeWav(
  "streak",
  trim(
    mix(
      { samples: sweep(S(500), 784, 790, 0.0012, 1) },
      { samples: sweep(S(500), 988, 992, 0.0012, 1), at: S(80) },
      { samples: dual(S(800), 1318, 0.0009, 2637, 0.0035), at: S(160), gain: 0.95 },
      { samples: dual(S(900), 2093, 0.0006, 4186, 0.004), at: S(260), gain: 0.5 },
      { samples: noise(S(400), 0.004, 0.9, 1), at: S(180), gain: 0.12 },
    ),
  ),
);

// Whoosh: soft filtered noise swell for navigation.
encodeWav("whoosh", trim(mix({ samples: noise(S(260), 0.0009, 0.06), gain: 1.35 })));

// Counter: subtle tick for count-up numbers.
encodeWav("counter", trim(noise(S(50), 0.0025, 0.5, 1), 0.004));
