"""Sound effects for the clawdhouse video, synthesized from scratch.

Reads the cues src/cues.ts found in the video's frames (each cut to a new
mood, each key typed, each thing Clawd's engine does on screen) and gives
every one a little 8-bit sound in the soundtrack's own voices: pulse,
triangle and noise. Tuned sounds take their notes from the chord playing at
that moment, so they sit inside the music. Mixes them over .build/music.wav
into .build/soundtrack.wav (and writes the effects alone to .build/sfx.wav).
"""

import json
import os
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "..", ".build")
TIMELINE = json.load(open(os.path.join(HERE, "timeline.json")))
CUES = json.load(open(os.path.join(BUILD, "cues.json")))
SR = 44100
BEAT = 60 / TIMELINE["bpm"]

with wave.open(os.path.join(BUILD, "music.wav")) as w:
    assert w.getframerate() == SR and w.getnchannels() == 2
    music = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").reshape(-1, 2) / 32767
N = len(music)

rng = np.random.default_rng(11)
bus = np.zeros((N, 2))

# ── The chords, so tuned effects land on notes of the harmony ──────────────

# One chord per bar, as src/music.py lays them out; keep the two in step.
C, Am, F, G = [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]
BARS = [C, G, C, Am, F, G, C, Am, F, G, F, G, F, G, Am, C]


def chord_at(t):
    beat = t / BEAT
    bar = min(int(beat // 4), len(BARS) - 1)
    if bar == 14 and beat % 4 >= 2:  # the reactions' last bar turns to G halfway
        return G
    return BARS[bar]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tone_of(t, degree, octave=1):
    """A note of the chord playing at t: degree 0, 1, 2 are root, third, fifth."""
    ch = chord_at(t)
    return ch[degree % 3] + 12 * (octave + degree // 3)


# ── Voices ─────────────────────────────────────────────────────────────────


def samples(seconds):
    return max(1, int(seconds * SR))


def glide(f0, f1, n, curve=1.0):
    """Frequency per sample, sliding from f0 to f1 (exponentially, like a pitch bend)."""
    x = np.linspace(0, 1, n) ** curve
    return f0 * (f1 / f0) ** x


def pulse(freqs, duty=0.25):
    phase = np.cumsum(freqs) / SR
    return np.where((phase % 1) < duty, 1.0, -1.0)


def tri(freqs):
    phase = (np.cumsum(freqs) / SR) % 1
    return np.round((4 * np.abs(phase - 0.5) - 1) * 7.5) / 7.5


def sine(freqs):
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)


def noise(n, rate=SR):
    """Sample-and-hold noise: lower rates sound darker, like the NES noise channel."""
    rate = np.broadcast_to(np.asarray(rate, dtype=float), (n,))
    clock = np.cumsum(rate / SR)
    held = rng.uniform(-1, 1, int(clock[-1]) + 2)
    return held[clock.astype(int)]


def bright(x):
    return np.diff(x, prepend=0)


def decay(n, tau, attack=0.002):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def swell(n, peak, attack_curve=2.0):
    """Rises to a peak, then falls away: the shape of a whoosh."""
    t = np.linspace(0, 1, n)
    rise = np.clip(t / peak, 0, 1) ** attack_curve
    fall = np.clip((1 - t) / (1 - peak), 0, 1) ** 1.5
    return np.where(t < peak, rise, fall)


def vibrato(freqs, rate=6.0, depth=0.02):
    t = np.arange(len(freqs)) / SR
    return freqs * (1 + depth * np.sin(2 * np.pi * rate * t))


def echo(x, delay=0.11, feedback=0.35, taps=3):
    d = samples(delay)
    out = np.zeros(len(x) + d * taps)
    for k in range(taps + 1):
        out[k * d : k * d + len(x)] += x * feedback**k
    return out


# Each cue's sound is gathered on its own take first, so it can be brought to
# its level before it goes on the bus (see `play` below).
take = []


def put(t, sig, gain, pan=0.0):
    take.append((t, sig * gain, pan))


# ── Building blocks ────────────────────────────────────────────────────────


def blip(t, midi, length=0.06, gain=0.12, duty=0.25, tau=0.05, pan=0.0, to=None, voice="pulse"):
    n = samples(length + tau * 3)
    f = glide(hz(midi), hz(to if to is not None else midi), n, 0.5)
    osc = {"pulse": lambda: pulse(f, duty), "tri": lambda: tri(f), "sine": lambda: sine(f)}[voice]()
    hold = samples(length)
    env = np.concatenate([np.ones(hold), np.exp(-np.arange(n - hold) / SR / (tau / 2))]) * decay(n, 1e9)
    put(t, osc * env, gain, pan)


def click(t, gain=0.05, pitch=2400.0, pan=0.0):
    """A key, a switch, a shutter blade: a few milliseconds of bright noise and a ping."""
    n = samples(0.018)
    body = bright(noise(n)) * decay(n, 0.0025) + 0.5 * pulse(np.full(n, pitch), 0.5) * decay(n, 0.004)
    put(t, body, gain, pan)


def thud(t, f0=160.0, f1=55.0, length=0.09, gain=0.2):
    n = samples(length)
    put(t, tri(glide(f0, f1, n)) * decay(n, length / 2.5), gain)
    put(t, bright(noise(samples(0.012), 6000)) * decay(samples(0.012), 0.004), gain * 0.25)


def swish(t, length=0.16, lo=1500.0, hi=9000.0, gain=0.07, pan=0.0, peak=0.35):
    """Noise whose grain rises then falls: a brush, a page, a broom, a plane."""
    n = samples(length)
    shape = swell(n, peak)
    rate = lo + (hi - lo) * shape
    put(t, bright(noise(n, rate)) * shape, gain, pan)


def bell(t, midi, gain=0.08, tau=0.35, pan=0.0):
    """Struck metal: a few inharmonic partials that ring out."""
    n = samples(tau * 4)
    f = hz(midi)
    body = sine(np.full(n, f)) + 0.45 * sine(np.full(n, f * 2.76)) + 0.2 * sine(np.full(n, f * 5.4))
    env = decay(n, tau) * (1 + 0.6 * decay(n, 0.02))
    put(t, body * env / 1.6, gain, pan)


def arp(t, notes, step=0.045, length=0.05, gain=0.09, duty=0.25, tau=0.08, pan=0.0, spread=0.0):
    for i, m in enumerate(notes):
        blip(t + i * step, m, length, gain, duty, tau, pan + spread * (i % 2 * 2 - 1))


def bloop(t, midi, gain=0.08, length=0.045, rise=1.7, pan=0.0):
    """A bubble: a sine that pops upward."""
    n = samples(length * 2)
    f = glide(hz(midi), hz(midi) * rise, n, 0.6)
    put(t, sine(f) * decay(n, length / 1.5, 0.003), gain, pan)


def zap(t, length=0.06, gain=0.06):
    n = samples(length)
    f = 900 * np.exp(-np.arange(n) / SR / 0.02) + 120 + 400 * noise(n, 2000)
    put(t, pulse(np.abs(f), 0.5) * decay(n, length / 2), gain)


# ── What each moment sounds like ───────────────────────────────────────────


def typing(t, times, gain=0.05):
    for i, dt in enumerate(times):
        click(t + dt, gain * rng.uniform(0.7, 1.1), rng.uniform(1800, 3200), rng.uniform(-0.25, 0.25))


def popper(t):
    """Confetti: a pop, a shower of sparkles and a short fanfare up the chord."""
    n = samples(0.05)
    put(t, bright(noise(n, 9000)) * decay(n, 0.012), 0.16)
    put(t, bright(noise(n, 9000)) * decay(n, 0.012), 0.08, -0.5)
    root = chord_at(t)
    arp(t + 0.03, [root[0] + 12, root[1] + 12, root[2] + 12, root[0] + 24], 0.05, 0.05, 0.08, 0.25, 0.07, spread=0.3)
    blip(t + 0.23, root[2] + 24, 0.12, 0.06, 0.125, 0.18)
    for k in range(6):
        blip(t + 0.05 + k * 0.035, tone_of(t, k, 3), 0.015, 0.025, 0.5, 0.02, pan=rng.uniform(-0.7, 0.7))


def rocket(t):
    n = samples(0.55)
    put(t, noise(n, 700) * swell(n, 0.25, 1), 0.09)
    put(t, pulse(glide(160, 900, n, 1.6), 0.125) * swell(n, 0.7) * 0.5, 0.05)


MOODS = {
    "idle": lambda t: [blip(t, tone_of(t, 2, 1), 0.05, 0.07, voice="tri"), blip(t + 0.08, tone_of(t, 0, 2), 0.07, 0.07, voice="tri")],
    "listening": lambda t: [swish(t, 0.16, 2000, 12000, 0.06, peak=0.75), blip(t + 0.02, 72, 0.08, 0.035, 0.125, 0.04, to=88),
                            bloop(t + 0.17, tone_of(t, 2, 2), 0.06)],
    "thinking": lambda t: [blip(t, tone_of(t, 1, 1), 0.09, 0.06, 0.5, 0.06, voice="tri"), blip(t + 0.13, tone_of(t, 0, 1), 0.14, 0.06, 0.5, 0.1, voice="tri")],
    "pondering": lambda t: [bloop(t + k * 0.09, tone_of(t, k, 2), 0.07 - k * 0.012) for k in range(3)],
    "exploring": lambda t: [thud(t + k * 0.14, 150, 90, 0.05, 0.12) for k in range(3)] + [blip(t + 0.3, tone_of(t, 2, 2), 0.03, 0.04, 0.5, 0.15)],
    "reading": lambda t: [swish(t, 0.1, 2500, 11000, 0.07, 0.3, 0.2), swish(t + 0.14, 0.08, 2500, 9000, 0.04, -0.3, 0.2)],
    "searching": lambda t: [put(t, echo(sine(np.full(samples(0.3), hz(tone_of(t, 0, 2)))) * decay(samples(0.3), 0.07), 0.17, 0.4, 2), 0.07)],
    "planning": lambda t: [click(t, 0.05, 2600), click(t + 0.07, 0.05, 2200), blip(t + 0.14, tone_of(t, 2, 2), 0.04, 0.07, 0.25, 0.1)],
    "branching": lambda t: [arp(t, [tone_of(t, k, 1) for k in range(4)], 0.04, 0.035, 0.07, duty=0.5, tau=0.04), blip(t + 0.16, tone_of(t, 1, 2), 0.04, 0.06, 0.5, 0.06, to=tone_of(t, 2, 2), voice="tri")],
    "installing": lambda t: [thud(t, 200, 60, 0.12, 0.24), typing(t + 0.1, [0, 0.03, 0.07], 0.035)],
    "writing": lambda t: [typing(t, [0, 0.05, 0.11, 0.16], 0.055)],
    "designing": lambda t: [swish(t, 0.16, 1200, 7000, 0.07, -0.3, 0.4), blip(t + 0.14, tone_of(t, 0, 3), 0.02, 0.04, 0.5, 0.06, 0.3), blip(t + 0.2, tone_of(t, 2, 3), 0.02, 0.035, 0.5, 0.08, 0.4)],
    "terminal": lambda t: [typing(t, [0, 0.05, 0.1], 0.06), click(t + 0.2, 0.08, 900), thud(t + 0.2, 300, 200, 0.03, 0.05)],
    "serving": lambda t: [bell(t, tone_of(t, 0, 2), 0.1, 0.3)],
    "snapping": lambda t: [click(t, 0.09, 3800), click(t + 0.06, 0.12, 1600), thud(t + 0.06, 260, 140, 0.03, 0.06), click(t + 0.17, 0.03, 4200)],
    "surfing": lambda t: [put(t, (lambda n: noise(n, 2600) * swell(n, 0.45) * (0.7 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 7)))(samples(0.5)), 0.08, -0.3),
                          put(t + 0.05, (lambda n: noise(n, 4000) * swell(n, 0.5))(samples(0.45)), 0.04, 0.4)],
    "casting": lambda t: [put(t, echo(np.concatenate([pulse(vibrato(np.full(samples(0.035), hz(tone_of(t, k, 2))), 18, 0.01), 0.125) * decay(samples(0.035), 0.03) for k in range(6)]), 0.09, 0.4, 2), 0.06, 0.2)],
    "plugging": lambda t: [click(t, 0.08, 1200), zap(t + 0.02, 0.07, 0.05), bloop(t + 0.12, tone_of(t, 0, 2), 0.06, 0.04, 2.0)],
    "querying": lambda t: [blip(t + k * 0.045, tone_of(t, int(rng.integers(0, 4)), 2 + k % 2), 0.025, 0.04, 0.5, 0.01, pan=0.3 * (k % 2 * 2 - 1)) for k in range(6)],
    "delegating": lambda t: [bloop(t, tone_of(t, 0, 1), 0.08, 0.04, 2.2, -0.4), bloop(t + 0.1, tone_of(t, 2, 1), 0.08, 0.04, 2.2, 0.4), swish(t + 0.16, 0.12, 2000, 8000, 0.03, 0.0, 0.5)],
    "mailing": lambda t: [swish(t, 0.3, 1200, 7000, 0.07, -0.4, 0.3), blip(t + 0.02, tone_of(t, 2, 2), 0.02, 0.03, 0.125, 0.03, 0.4, to=tone_of(t, 2, 2) + 7)],
    "building": lambda t: [bell(t + k * 0.21, 88 + k, 0.06, 0.05) or thud(t + k * 0.21, 240, 120, 0.03, 0.06) for k in range(2)],
    "testing": lambda t: [bell(t, tone_of(t, 2, 2), 0.05, 0.08, 0.2), bloop(t + 0.08, tone_of(t, 0, 1), 0.05)],
    "oops": lambda t: [blip(t, 58, 0.07, 0.09, 0.5, 0.03), blip(t + 0.1, 52, 0.12, 0.09, 0.5, 0.08, to=50), put(t, noise(samples(0.08), 3000) * decay(samples(0.08), 0.03), 0.04)],
    "sad": lambda t: [put(t, pulse(vibrato(glide(hz(67), hz(59), samples(0.45), 0.8), 5.5, 0.015), 0.25) * swell(samples(0.45), 0.08, 1), 0.07)],
    "debugging": lambda t: [click(t + k * 0.022, 0.025, 5000 - 300 * k) for k in range(6)] + [swish(t + 0.16, 0.08, 6000, 1200, 0.05, 0.2, 0.15)],
    "polishing": lambda t: [bell(t, tone_of(t, 2, 2), 0.05, 0.14, 0.3), bell(t + 0.07, tone_of(t, 0, 3), 0.03, 0.18, -0.3)],
    "benchmarking": lambda t: [click(t + k * BEAT / 4, 0.05 if k % 2 else 0.06, 3200 if k % 2 else 2400) for k in range(4)],
    "phoning": lambda t: [put(t, pulse(np.where((np.arange(samples(0.28)) // samples(0.022)) % 2, hz(tone_of(t, 2, 2)), hz(tone_of(t, 0, 3))), 0.125) * swell(samples(0.28), 0.1, 1), 0.045)],
    "asking": lambda t: [blip(t, tone_of(t, 0, 1), 0.1, 0.07, 0.25, 0.05, to=tone_of(t, 2, 1) + 2), blip(t + 0.16, tone_of(t, 2, 2), 0.03, 0.04, 0.5, 0.05)],
    "waiting": lambda t: [blip(t + k * 0.13, 79, 0.006, 0.12, tau=0.025, voice="tri") or click(t + k * 0.13, 0.03, 1200) for k in range(2)],
    "timing": lambda t: [click(t, 0.07, 3400), click(t + BEAT / 2, 0.05, 2200)],
    "remembering": lambda t: [put(t, echo(np.concatenate([sine(np.full(samples(0.09), hz(tone_of(t, 1, 2)))) * decay(samples(0.09), 0.1), sine(np.full(samples(0.3), hz(tone_of(t, 2, 2)))) * decay(samples(0.3), 0.12)]), 0.13, 0.3, 2), 0.07)],
    "compacting": lambda t: [put(t, bright(noise(samples(0.22), glide(12000, 900, samples(0.22)))) * decay(samples(0.22), 0.09), 0.08), thud(t + 0.16, 140, 45, 0.1, 0.2)],
    "talking": lambda t: [blip(t + k * 0.075, tone_of(t, int(rng.integers(0, 5)), 1), 0.035, 0.05, 0.5, 0.015, to=tone_of(t, 0, 1) + int(rng.integers(-2, 3))) for k in range(5)],
    "committing": lambda t: [thud(t, 170, 70, 0.07, 0.2), click(t + 0.07, 0.06, 1400), blip(t + 0.17, tone_of(t, 2, 1), 0.05, 0.07, 0.5, 0.02), blip(t + 0.22, tone_of(t, 0, 2), 0.15, 0.07, 0.5, 0.12)],
    "cleaning": lambda t: [swish(t, 0.12, 3000, 8000, 0.06, -0.4), swish(t + 0.2, 0.12, 3000, 8000, 0.06, 0.4)],
    "shipping": lambda t: [rocket(t)],
    "happy": lambda t: [popper(t)],
    "sleepy": lambda t: [put(t, noise(samples(0.42), 900) * swell(samples(0.42), 0.6, 1.5) * (0.6 + 0.4 * np.sin(np.arange(samples(0.42)) / SR * 2 * np.pi * 32)), 0.07),
                         blip(t + 0.3, 84, 0.1, 0.02, 0.5, 0.1, to=79, voice="sine")],
}

REACTIONS = {
    "hello": lambda t: [blip(t, tone_of(t, 2, 1), 0.05, 0.08, 0.25, 0.03), blip(t + 0.07, tone_of(t, 0, 2), 0.12, 0.08, 0.25, 0.1), bloop(t + 0.12, tone_of(t, 1, 3), 0.03), bloop(t + 0.2, tone_of(t, 2, 3), 0.025)],
    "found": lambda t: [blip(t, tone_of(t, 1, 1), 0.04, 0.08, 0.125, 0.02), blip(t + 0.06, tone_of(t, 0, 2), 0.18, 0.08, 0.125, 0.15)],
    "none": lambda t: [blip(t, 55, 0.06, 0.08, voice="tri", to=50, tau=0.05)],
    "edit": lambda t: [blip(t, tone_of(t, 2, 2), 0.04, 0.07, 0.5, 0.03), blip(t + 0.07, tone_of(t, 0, 1), 0.04, 0.06, 0.5, 0.04)],
    "pass": lambda t: [arp(t, [tone_of(t, k, 1) for k in range(4)], 0.05, 0.045, 0.08, 0.25, 0.06), blip(t + 0.2, tone_of(t, 1, 2), 0.14, 0.07, 0.25, 0.15),
                       bell(t + 0.2, tone_of(t, 0, 2), 0.03, 0.2, 0.3)],
    "fail": lambda t: [blip(t, chord_at(t)[0], 0.08, 0.09, 0.5, 0.02), blip(t + 0.1, chord_at(t)[0] - 1, 0.18, 0.09, 0.5, 0.08, to=chord_at(t)[0] - 3), zap(t + 0.1, 0.12, 0.03)],
    "phew": lambda t: [blip(t, 81, 0.25, 0.05, voice="sine", to=69, tau=0.06), bloop(t + 0.22, 84, 0.04), bloop(t + 0.3, 79, 0.035)],
    "denied": lambda t: [blip(t, chord_at(t)[0], 0.06, 0.07, 0.5, 0.02), blip(t + 0.09, chord_at(t)[0] - 5, 0.1, 0.07, 0.5, 0.05)],
    "noted": lambda t: [bell(t, tone_of(t, 1, 2), 0.05, 0.2), bell(t + 0.09, tone_of(t, 2, 2), 0.05, 0.25)],
    "combo": lambda t: [arp(t, [tone_of(t, k, 1) for k in range(8)], 0.032, 0.03, 0.07, 0.125, 0.03, spread=0.25)],
    "streak": lambda t: [swish(t, 0.32, 1500, 12000, 0.06, 0, 0.8), blip(t, 55, 0.3, 0.05, 0.125, 0.04, to=79)] + [click(t + 0.05 + k * 0.04, 0.025, rng.uniform(2000, 5000), rng.uniform(-0.5, 0.5)) for k in range(6)],
}

ENGINE = {
    "key": lambda t, q: typing(t, [0], 0.045),
    "tap": lambda t, q: click(t, 0.03, rng.uniform(2200, 3400), rng.uniform(-0.2, 0.2)),
    "bubble": lambda t, q: bloop(t, tone_of(t, int(rng.integers(0, 3)), 1), 0.035),
    "hero": lambda t, q: arp(t, [tone_of(t, k, 2) for k in range(5)], 0.06, 0.05, 0.035, 0.125, 0.25, spread=0.3),
    "jump": lambda t, q: blip(t, tone_of(t, int(rng.integers(0, 3)), 1), 0.05, 0.035, 0.5, 0.03, to=tone_of(t, 0, 2) + 7, voice="tri"),
    "land": lambda t, q: thud(t, 130, 60, 0.04, 0.07),
    "bounce": lambda t, q: thud(t, 150, 70, 0.05, 0.1),
    "count": lambda t, q: blip(t, tone_of(t, 0, 2), 0.06, 0.06, 0.5, 0.03),
    "liftoff": lambda t, q: rocket(t),
    "hammer": lambda t, q: [bell(t, 89, 0.05, 0.05), thud(t, 240, 120, 0.03, 0.05)],
    "shutter": lambda t, q: [click(t, 0.08, 3800), click(t + 0.05, 0.1, 1600)],
    "flag": lambda t, q: [blip(t, tone_of(t, 2, 1), 0.05, 0.06, 0.5, 0.02), blip(t + 0.06, tone_of(t, 0, 2), 0.12, 0.06, 0.5, 0.1)],
    "plane": lambda t, q: swish(t, 0.25, 1200, 6000, 0.04, 0.4, 0.3),
    "snore": lambda t, q: MOODS["sleepy"](t),
}

# ── Levels ─────────────────────────────────────────────────────────────────

# How loud each kind of moment plays, in dBFS of its loudest 30 ms. A mood's
# own sound leads; the little ones (keys, bubbles, footfalls) sit underneath.
LEVEL = {
    "mood": -15, "react": -14, "confetti": -13, "hero": -22,
    "key": -23, "tap": -26, "bubble": -24, "jump": -23, "land": -26, "bounce": -23,
    "count": -19, "liftoff": -15, "hammer": -19, "shutter": -19, "flag": -19, "plane": -20, "snore": -20,
}
PEAK = 10 ** (-8 / 20)  # and nothing peaks past -8 dBFS before the mix


def loudest(x, window=0.03):
    power = (x**2).mean(axis=1)
    k = min(len(power), samples(window))
    return np.sqrt(np.convolve(power, np.ones(k) / k, mode="valid").max())


def play(t, level, sound, *args):
    """Plays one cue's sound at t, brought to `level` (a key of LEVEL)."""
    take.clear()
    sound(t, *args)
    if not take:
        return
    start = int(round(t * SR))
    n = max(int(round(at * SR)) - start + len(sig) for at, sig, _ in take)
    clip = np.zeros((n, 2))
    for at, sig, pan in take:
        i = int(round(at * SR)) - start
        clip[i : i + len(sig), 0] += sig * (1 - max(0, pan))
        clip[i : i + len(sig), 1] += sig * (1 + min(0, pan))
    gain = min(10 ** (LEVEL[level] / 20) / max(1e-9, loudest(clip)), PEAK / np.abs(clip).max())
    end = min(N, start + n)
    if start < N:
        bus[start:end] += clip[: end - start] * gain


unknown = set()
for q in CUES["cues"]:
    t, kind = q["t"], q["kind"]
    if kind == "cut":
        section, name = q["name"].split(":")
        if section == "/clawd":
            play(t, "confetti" if name == "happy" else "mood", MOODS[name])
        elif section == "all":
            play(t, "confetti", popper)
        # A reaction's cut stays quiet: its sound comes a frame later, with the pop.
    elif kind == "react":
        play(t, "react", REACTIONS[q["name"]])
    elif kind == "enter":
        # Confetti again on the final chord.
        if q["name"] == "happy":
            play(t, "confetti", popper)
    elif kind in ENGINE:
        play(t, kind, ENGINE[kind], q)
    else:
        unknown.add(kind)
assert not unknown, f"no sound for cues: {unknown}"

# ── Mix down ───────────────────────────────────────────────────────────────

sfx = bus

# The music comes down a little to make room, and ducks a touch more under
# each effect, then swells back.
MUSIC = 0.85
level = np.abs(sfx).max(axis=1)
k = samples(0.004)
level = np.convolve(level, np.ones(k) / k, mode="same")
release = np.exp(-1 / (0.12 * SR))
env = np.empty(N)
acc = 0.0
for i in range(0, N, 64):  # follow the level 64 samples at a time; plenty for ducking
    peak = level[i : i + 64].max()
    acc = max(peak, acc * release**64)
    env[i : i + 64] = acc
duck = 1 - 0.25 * np.clip(env / 0.2, 0, 1)

# A soft knee: anything past 0.8 bends smoothly toward full scale.
mix = music * MUSIC * duck[:, None] + sfx
over = np.abs(mix) > 0.8
mix[over] = np.sign(mix[over]) * (0.8 + 0.2 * np.tanh((np.abs(mix[over]) - 0.8) / 0.2))


def write(name, x):
    path = os.path.join(BUILD, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    return os.path.normpath(path)


write("sfx.wav", sfx / max(1e-9, np.max(np.abs(sfx))) * 0.9)
print(f"wrote {write('soundtrack.wav', mix)} ({len(CUES['cues'])} cues over {N / SR:.2f}s of music)")
