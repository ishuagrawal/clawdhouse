"""An original chiptune for the clawdhouse video, synthesized from scratch.

Pulse-wave lead and harmony, a stepped triangle bass and noise drums, laid
out on the same beat grid as the video (src/timeline.json): a two-bar
intro, the melody under the forty moods, a two-bar build, a stab on every
beat for the reactions, and a final chord. Writes .build/music.wav.
"""

import json
import os
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TIMELINE = json.load(open(os.path.join(HERE, "timeline.json")))
SR = 44100
BPM = TIMELINE["bpm"]
BEAT = 60 / BPM
BEATS = sum(TIMELINE["beats"].values())
LENGTH = BEATS * BEAT + TIMELINE["tail"]
N = int(LENGTH * SR)

rng = np.random.default_rng(7)
left = np.zeros(N)
right = np.zeros(N)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def at(beat):
    return int(round(beat * BEAT * SR))


def envelope(n, attack=0.004, decay=0.09, sustain=0.65, release=0.06):
    t = np.arange(n + int(release * SR)) / SR
    hold = n / SR
    env = np.where(t < attack, t / attack, sustain + (1 - sustain) * np.exp(-(t - attack) / decay))
    tail = t > hold
    env[tail] *= np.exp(-(t[tail] - hold) / (release / 3))
    return env


def pulse(freq, n, duty, vibrato=0.0):
    t = np.arange(n) / SR
    f = freq * (1 + vibrato * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1))
    phase = np.cumsum(f) / SR
    return np.where((phase % 1) < duty, 1.0, -1.0)


def triangle(freq, n):
    phase = (np.arange(n) * freq / SR) % 1
    tri = 4 * np.abs(phase - 0.5) - 1
    return np.round(tri * 7.5) / 7.5  # sixteen steps, like the 2A03's triangle


def add(sig, start, gain, pan=0.0):
    end = min(N, start + len(sig))
    sig = sig[: end - start] * gain
    left[start:end] += sig * (1 - max(0, pan))
    right[start:end] += sig * (1 + min(0, pan))


def note(midi, beat, length, gain, duty=0.25, pan=0.0, voice="pulse", **env):
    n = int(length * BEAT * SR)
    e = envelope(n, **env)
    if voice == "tri":
        wave_ = triangle(hz(midi), len(e))
    else:
        wave_ = pulse(hz(midi), len(e), duty, vibrato=0.006 if length >= 1 else 0.0)
    add(wave_ * e, at(beat), gain, pan)


def kick(beat, gain=0.55):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.03)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07), at(beat), gain)


def crunchy_noise(n, rate):
    # Sample-and-hold noise: the coarse hiss of an 8-bit noise channel.
    step = max(1, int(SR / rate))
    return np.repeat(rng.uniform(-1, 1, n // step + 1), step)[:n]


def snare(beat, gain=0.26):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    body = crunchy_noise(n, 9000) * np.exp(-t / 0.05)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.03)
    add(body + 0.5 * tone, at(beat), gain)


def hat(beat, gain=0.07, open_=False, pan=0.25):
    n = int((0.16 if open_ else 0.045) * SR)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0)  # tilt it bright
    add(noise * np.exp(-t / (0.05 if open_ else 0.012)), at(beat), gain, pan)


def crash(beat, gain=0.13, length=1.8):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = np.diff(crunchy_noise(n, 16000), prepend=0)
    add(noise * np.exp(-t / (length / 4)), at(beat), gain, -0.2)
    add(noise * np.exp(-t / (length / 4)), at(beat), gain, 0.2)


# ── The score ──────────────────────────────────────────────────────────────

C, Am, F, G = [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]
ROOT = {id(C): 48, id(Am): 45, id(F): 41, id(G): 43}

intro, moods, reactions, outro = (TIMELINE["beats"][k] for k in ("intro", "moods", "reactions", "outro"))
assert (intro, moods, reactions, outro) == (8, 40, 12, 4), "the score is written for this layout"

# Melody for bars 3–10: (beat in bar, length in beats, midi), None rests.
A1 = [(0, .5, 79), (.5, .5, 76), (1, .5, 79), (1.5, 1, 84), (2.5, .5, 83), (3, .5, 84), (3.5, .5, 86)]
A2 = [(0, 1.5, 88), (1.5, .5, 86), (2, .5, 84), (2.5, 1.5, 81)]
A3 = [(0, .5, 77), (.5, .5, 81), (1, .5, 84), (1.5, .5, 81), (2, 1, 86), (3, .5, 84), (3.5, .5, 81)]
A4 = [(0, 1, 83), (1, .5, 79), (1.5, .5, 81), (2, .5, 83), (2.5, 1.5, 86)]
B2 = [(0, 1, 88), (1, .5, 86), (1.5, .5, 88), (2, 1, 84), (3, 1, 81)]
B3 = [(0, .5, 84), (.5, .5, 81), (1, .5, 77), (1.5, .5, 81), (2, .5, 84), (2.5, .5, 89), (3, .5, 88), (3.5, .5, 86)]
B4 = [(0, 1.5, 86), (1.5, .5, 83), (2, 1.5, 79)]
BUILD1 = [(i * .5, .5, m) for i, m in enumerate([77, 81, 84, 81, 84, 89, 84, 89])]
BUILD2 = [(0, .5, 79), (.5, .5, 83), (1, .5, 86), (1.5, .5, 91)] + [(2 + i * .25, .25, m) for i, m in enumerate([86, 88, 89, 91, 93, 95])] + [(3.5, .5, 96)]

bars = []  # (chord, melody)
bars += [(C, None), (G, None)]                                      # intro
bars += [(C, A1), (Am, A2), (F, A3), (G, A4), (C, A1), (Am, B2), (F, B3), (G, B4)]
bars += [(F, BUILD1), (G, BUILD2)]                                 # build
bars += [(F, None), (G, None), (Am, None)]                         # reactions
bars += [(C, None)]                                                # outro

for b, (chord, melody) in enumerate(bars):
    s = b * 4
    bar = b + 1
    root = ROOT[id(chord)]

    # Lead, with a dotted-eighth echo bouncing left and right.
    for beat, length, m in melody or []:
        note(m, s + beat, length * 0.92, 0.17, duty=0.25)
        note(m, s + beat + 0.75, length * 0.8, 0.06, duty=0.25, pan=-0.6)
        note(m, s + beat + 1.5, length * 0.7, 0.03, duty=0.25, pan=0.6)

    # Harmony: offbeat stabs, then sixteenth arpeggios once the tune repeats.
    if bar == 1:
        for i in range(16):
            note(chord[i % 3] + 12 * (i // 3 % 2), s + i * .25, .22, 0.06, duty=0.5, pan=0.35, sustain=0.3)
    elif bar == 2:
        for i in range(16):
            note(chord[i % 3] + 12 * (i // 3 % 2), s + i * .25, .22, 0.07, duty=0.5, pan=0.35, sustain=0.3)
    elif 3 <= bar <= 6:
        for i in range(4):
            for m in chord:
                note(m + 12, s + i + .5, .3, 0.035, duty=0.125, pan=-0.35, sustain=0.2)
    elif 7 <= bar <= 10:
        for i in range(16):
            note(chord[i % 3] + 12 + 12 * (i // 3 % 2), s + i * .25, .2, 0.045, duty=0.5, pan=0.35, sustain=0.25)
    elif bar in (11, 12):
        for m in chord:
            note(m + 12, s, 3.9, 0.035, duty=0.125, pan=-0.35, sustain=0.8)
    elif 13 <= bar <= 15:
        chords = [chord] * 4 if bar < 15 else [Am, Am, G, G]
        for i, ch in enumerate(chords):
            for m in ch:
                note(m + 12, s + i, .18, 0.07, duty=0.25, sustain=0.2)
            # A sparkle on the "and": the reaction landing.
            note(ch[2] + 24, s + i + .5, .1, 0.05, duty=0.5, pan=0.4, sustain=0.1)
            note(ch[0] + 36, s + i + .75, .1, 0.035, duty=0.5, pan=-0.4, sustain=0.1)
    elif bar == 16:
        for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]):
            note(m + 12, s + i * .25, .3, 0.06, duty=0.5, pan=0.3, sustain=0.3)
        for m in C + [72]:
            note(m + 12, s + 2, 2 + TIMELINE["tail"] / BEAT - .4, 0.05, duty=0.125, release=0.9)
        note(84, s + 2, 2 + TIMELINE["tail"] / BEAT - .4, 0.15, duty=0.25, release=0.9)

    # Bass: an octave-hopping eighth-note walk on the triangle.
    if bar == 2:
        for i in range(4):
            note(root, s + i, .45, 0.27, voice="tri", sustain=0.9)
    elif 3 <= bar <= 15:
        roots = [root] * 4 if bar < 15 else [45, 45, 43, 43]
        for i in range(8):
            r = roots[i // 2]
            note(r + (12 if i % 2 else 0), s + i * .5, .45, 0.27, voice="tri", sustain=0.9)
    elif bar == 16:
        note(36, s, 1.8, 0.36, voice="tri", sustain=0.9, release=0.3)
        note(48, s + 2, 2, 0.30, voice="tri", sustain=0.9, release=0.8)

    # Drums.
    if bar == 1:
        for i in range(8):
            hat(s + i * .5, 0.05)
    elif bar == 2:
        kick(s)
        kick(s + 2)
        for i in range(6):
            hat(s + i * .5)
        for i, g in enumerate([.12, .16, .2, .26]):
            snare(s + 3 + i * .25, g)
    elif 3 <= bar <= 10:
        if bar in (3, 7):
            crash(s)
        kick(s)
        kick(s + 2)
        if bar % 2 == 0:
            kick(s + 2.5, 0.4)
        snare(s + 1)
        snare(s + 3)
        for i in range(8):
            hat(s + i * .5, 0.07 if i % 2 else 0.05, open_=(i == 7))
    elif bar == 11:
        for i in range(4):
            kick(s + i)
        for i in range(8):
            snare(s + i * .5, 0.12 + 0.012 * i)
    elif bar == 12:
        for i in range(4):
            kick(s + i)
        for i in range(16):
            snare(s + i * .25, 0.14 + 0.009 * i)
    elif 13 <= bar <= 15:
        if bar == 13:
            crash(s)
        for i in range(4):
            kick(s + i)
        snare(s + 1)
        snare(s + 3)
        for i in range(16):
            hat(s + i * .25, 0.05 if i % 2 else 0.035)
        if bar == 15:
            for i, g in enumerate([.14, .18, .22, .28]):
                snare(s + 3 + i * .25, g)
    elif bar == 16:
        kick(s, 0.6)
        crash(s, 0.16, length=3.2)

# ── Mix down ───────────────────────────────────────────────────────────────


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # A one-pole filter, vectorised in blocks via cumulative products would be
    # faster; this is a few seconds of audio, so the plain loop is fine.
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


mix = np.stack([lowpass(left, 7500), lowpass(right, 7500)], axis=1)
mix /= np.max(np.abs(mix)) / 0.89
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = int(0.04 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]

out = os.path.join(HERE, "..", ".build", "music.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"wrote {os.path.normpath(out)} ({LENGTH:.2f}s, {BPM} bpm)")
