# Spike Rivals — Music Direction + AI Generation Prompts

> Goal: a soundtrack that feels like **early 90s arcade sports** meets **cyberpunk neo‑noir** (Blade Runner / synthwave), while staying *loopable and readable* like classic fighting games.

This guide gives:
- A **sound bible** (instrument palette, mix targets)
- A **track list** (menu, character select, match, victory stingers, etc.)
- **AI music prompts** you can paste into a music generator
- Practical integration notes for Phaser

---

## 1) Sound bible (keep everything coherent)

### Core palette
- **Drums:** 909/707 style hits + crunchy arcade percussion; occasional breakbeat fills (but keep it clean).
- **Bass:** FM bass or analog mono bass (Juno/SH‑101 vibe), sidechained slightly to kick.
- **Harmony:** dark neo‑noir pads (minor chords, suspended tones), subtle chorus.
- **Leads:** simple 2–4 note motifs (fighting-game style), arpeggiators, occasional guitar-synth plucks.
- **Texture:** rain ambience, distant crowd, neon hum — *very low in mix*.

### Mixing targets (practical)
- Deliver loops at **-14 LUFS integrated** (safe for web).
- Keep peaks under **-1 dBTP**.
- Avoid too much sub-bass (<40Hz) — mobile speakers will distort.

### Looping rules
- Match music is a **seamless loop** (ideally 60–90 seconds).
- Export with a short pre-roll fade-in removed; loop boundaries must be clean.

---

## 2) Track list (what you actually need)

### Mandatory (MVP)
1. **Intro / Boot stinger** (5–8s) — logo reveal
2. **Menu theme** (loop 60–90s)
3. **Character Select theme** (loop 45–60s)
4. **Match theme — Neon District** (loop 60–90s)
5. **Win stinger** (2–3s)
6. **Lose stinger** (2–3s)
7. **UI SFX pack** (cursor, select, back)
8. **Gameplay SFX pack** (jump, bump, spike, perfect hit, score)

### Nice-to-have (polish)
- One match theme per stage (Neon District, Cyber Arena, Night Market, etc.)
- **Character motif stingers** (1–2s) that play when selecting a character

---

## 3) Character leitmotifs (music identity per character)

These are **short motifs**, not full songs (unless you want them as match themes).

### Blitz (Speedster)
- **Tempo:** 150–170 BPM
- **Key/mode:** E minor or F# minor
- **Motif:** fast arpeggio + staccato lead ("zip" feel)
- **Texture:** subtle electric zaps

### Crusher (Power)
- **Tempo:** 110–125 BPM
- **Key/mode:** D minor
- **Motif:** heavy bass + industrial hits
- **Texture:** metal clangs, arena thumps

### Sky (High flyer)
- **Tempo:** 105–120 BPM
- **Key/mode:** A minor (add suspended tones)
- **Motif:** airy pad + bell lead
- **Texture:** wind / shimmer

### Zen (Precision)
- **Tempo:** 90–105 BPM
- **Key/mode:** C# minor or D minor
- **Motif:** minimal pluck + clean kick
- **Texture:** subtle glitch clicks (very light)

### Tank (Defense)
- **Tempo:** 95–110 BPM
- **Key/mode:** G minor
- **Motif:** slow marching bass + steady drums

### Flash (Ultra speed)
- **Tempo:** 165–180 BPM
- **Key/mode:** F minor
- **Motif:** bright lead + rapid snare rolls

### Nova (Balanced leader)
- **Tempo:** 125–140 BPM
- **Key/mode:** B minor
- **Motif:** heroic chord progression + punchy hook

### Ghost (Tricky)
- **Tempo:** 100–120 BPM
- **Key/mode:** E♭ minor
- **Motif:** detuned lead + reverse swell
- **Texture:** vinyl crackle + digital glitch

---

## 4) AI generation prompt templates

### Global prompt header
Paste this at the start of every prompt:

```text
Instrumental only. Retro arcade + cyberpunk neo-noir. Clean mix. Seamless loop. No vocals. No lyrics. 90s arcade soundtrack vibe.
```

### Menu theme prompt (loop)
```text
[GLOBAL HEADER]
Menu music loop 80–100 BPM. Dark neon synthwave with warm pads, simple arpeggio, gentle 707 drums, subtle rain ambience. Uplifting but mysterious. 60–90 seconds. Seamless loop.
```

### Character Select theme prompt
```text
[GLOBAL HEADER]
Character select loop 110–120 BPM. Punchy arcade groove, short repeating hook, minimal melody, lots of space for UI sounds. Bright neon accents, subtle crowd/arena texture. 45–60 seconds. Seamless loop.
```

### Match theme prompt (Neon District)
```text
[GLOBAL HEADER]
Match theme for a cyberpunk rooftop in the rain. 125–135 BPM. Driving kick, snappy snare, FM bass, neon arpeggios, minor key pads, occasional risers every 8 bars. 60–90 seconds. Seamless loop.
```

### Win stinger prompt (2–3s)
```text
[GLOBAL HEADER]
Very short victory stinger 2–3 seconds. Arcade win flourish, bright major chord hit, quick ascending lead, tight ending.
```

### Lose stinger prompt (2–3s)
```text
[GLOBAL HEADER]
Very short defeat stinger 2–3 seconds. Neo-noir minor chord, short descending lead, tight ending.
```

### Character stinger prompt (1–2s)
Use once per character:
```text
[GLOBAL HEADER]
Short character motif stinger 1–2 seconds for {CHARACTER}. Use {CHARACTER NOTES}. Must end cleanly.
```

Where `{CHARACTER NOTES}` is the relevant motif notes from Section 3.

---

## 5) Practical workflow to get usable game audio

1) **Generate 2–3 variations** per track.
2) Pick the best and export **WAV** if possible.
3) In an editor (Audacity/Reaper/etc.):
   - Trim silence
   - Ensure loop boundaries are zero-crossing
   - Normalize/mix to ~-14 LUFS integrated
4) Export to web-friendly formats:
   - **OGG** for web (good quality/size)
   - optionally MP3 fallback

---

## 6) Recommended file structure + naming (client/public)

Create:

```
client/public/assets/audio/
  music/
    music-menu.ogg
    music-select.ogg
    music-neon-district.ogg
  stingers/
    stinger-win.ogg
    stinger-lose.ogg
    stinger-blitz.ogg
    stinger-crusher.ogg
    stinger-sky.ogg
    stinger-zen.ogg
    stinger-tank.ogg
    stinger-flash.ogg
    stinger-nova.ogg
    stinger-ghost.ogg
  sfx/
    ui-move.ogg
    ui-select.ogg
    ui-back.ogg
    jump.ogg
    bump.ogg
    spike.ogg
    hit-perfect.ogg
    score.ogg
```

---

## 7) Phaser integration notes (so it actually works)

- Browsers require a **user gesture** before audio starts.
  - Start music on first pointerdown/keydown if muted state allows.
- Implement **crossfade** when switching music (250–500ms).
- Keep UI SFX volume lower than gameplay SFX.

---

## 8) Extra polish ideas (later)

- Stage ambience layers (rain, crowd) as separate loops mixed quietly.
- “Last point” intensity: when score reaches match point, crossfade to a higher-energy variation.
- Perfect hit adds a short pitch-shifted sparkle layer.

