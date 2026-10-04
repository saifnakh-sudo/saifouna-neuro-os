# SAIFOUNA NEURO-OS

I designed and developed SAIFOUNA NEURO-OS entirely myself for my web development project at **GDG on Campus – ENSAK**. It is a music-discovery interface where users describe a mood, scene, or atmosphere and explore matching music searches.

## Technologies

HTML5 · CSS3 · Vanilla JavaScript · Tailwind CSS · Three.js · GSAP · YouTube IFrame API

The JavaScript also includes a Google Gemini request flow for generating a music concept with a title, description, genres, mood, and search query.

## Features

- A prompt-based music discovery interface.
- Search links for YouTube, Spotify, Apple Music, and SoundCloud.
- YouTube playback controls and a progress bar.
- Session history saved in browser localStorage.
- Colour themes based on keyword scoring.
- Three.js background animation and Canvas particle effects.
- Separate Core, Archives, Uplink, and Research views.

## Run locally

Keep `index.html`, `style.css`, and `script.js` in the same folder. Start a local web server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in a browser and enter **DEMO-001** at the login screen. Internet access is required for the external libraries and YouTube player.

## Demo behaviour

API credentials are blank in this version. The prompt flow uses local sample responses and a fallback YouTube video. The YouTube lookup function is a placeholder that returns this same video; platform search links use the entered prompt or generated search query.

The login is a browser-side demo gate. Session history uses localStorage, and the animated indicators are visual effects. The contact form needs separate configuration to send messages.

## Files

- `index.html`: interface structure.
- `style.css`: themes, layout, and visual effects.
- `script.js`: interactions, player controls, demo responses, history, and API request code.
