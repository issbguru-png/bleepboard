---
title: "How to Add Sounds to Your Discord Soundboard"
description: "Upload custom sounds to a Discord server soundboard, the file limits and permissions you need, and how to play longer clips with a virtual audio cable."
date: 2026-08-26
tags: [discord, how-to, soundboard]
image: /blog/how-to-add-sounds-to-discord-soundboard.png
imageAlt: "Abstract Bleepboard artwork: an arrow lifting a small waveform clip up out of a tray, drawn as a plain upload symbol"
---

Discord has a built-in soundboard and it's genuinely good. One click and your clip plays to everyone in the voice channel. The catch is that it's deliberately built for *very* short sounds, so half of what people want to play won't fit. Here's how to use it properly, and what to do when your clip is too long.

## Uploading a sound to a server soundboard

The soundboard lives at the **server** level rather than the account level, so sounds you add belong to that server and everyone in it can use them.

1. Open the server and click the server name at the top of the channel list.
2. Choose **Server Settings**.
3. Find **Soundboard** in the left-hand sidebar.
4. Click **Upload Sound**.
5. Pick your audio file, give it a name, and optionally attach an emoji so it's easy to spot in the picker.
6. Set the default volume. Worth turning down before you save, not after your friends have already been blasted.
7. Save.

To play a sound, join a voice channel and open the soundboard panel from the voice controls (the smiley-face-with-speaker icon). Click a sound and it plays to the channel.

Uploading is desktop and web only — the mobile app can play soundboard sounds but cannot add them. If you are on a phone, open Discord in a browser and request the desktop site. In a voice call, swipe up on the call controls to reach the soundboard picker.

## The limits you need to know about

**Clips have to be short.** This is the big one. Discord's soundboard is designed for stingers, not songs — a single yell, a ping, a boom. In practice you're looking at a handful of seconds at most, and if your clip runs longer than a short sound effect Discord will simply refuse it. Trim before you upload rather than hoping.

**Files have to be small.** The size ceiling is tight, which follows naturally from the length limit. A trimmed MP3 of a couple of seconds sits comfortably inside it. If you're near the edge, re-export at a lower bitrate; nobody will hear the difference on a two-second meme sound.

**Format:** MP3 and OGG are the sensible choices. Discord accepts WAV too, but the 512KB cap makes it a waste of the budget, so convert first and you'll drop most of the file size for free.

**Slot count depends on server boosts.** Every server gets a base number of soundboard slots, and boosting the server raises that allowance at each boost level, the same way boosting raises emoji and sticker limits. If you've run out of room, that's the lever.

**Permissions.** To *upload* you need permission to manage the server's expressions, the same permission group that covers emoji and stickers, so usually an admin or a specifically-granted role. To *use* the soundboard you need the "Use Soundboard" permission on the server, and server owners can switch it off entirely for a role or a channel if things get out of hand. Using sounds from *other* servers inside a server needs the external-sounds permission and a Nitro subscription.

## Playing longer clips: the virtual audio cable route

If your clip is too long for the native soundboard, whether that's a full song, a long bit or an entire copypasta, the workaround is to stop treating it as a soundboard sound and start treating it as your microphone.

You install a **virtual audio device**, a fake sound card that shows up as both an output and an input. Send audio *into* it from your browser, then select it as your **microphone** in Discord. Discord can't tell the difference.

- **Windows:** VB-Audio's VB-CABLE is the standard free option. VoiceMeeter, from the same developer, adds a mixer so your actual voice goes through too.
- **macOS:** BlackHole, paired with a Multi-Output Device in Audio MIDI Setup so you can still hear what you're playing.
- **Linux:** PulseAudio/PipeWire creates a null sink and loopback natively, no extra software needed.

Two practical notes. Route your desktop audio to the virtual cable *and* your headphones, or you'll be playing sounds you can't hear. And turn **noise suppression and echo cancellation off** in Discord's voice settings — they're tuned for speech and will chew through music and effects until everything sounds underwater.

## Good clips to start with

Short, punchy and already trimmed. Play them here and download the MP3 free:

- [Discord Join Call](/sound/discord-join/) and [Discord Leave Call](/sound/discord-leave/), the classics, for fake joins
- [Discord Ping](/sound/discord-ping/), reliably makes someone check their phone
- [Vine Boom](/sound/vine-boom/), the punchline sound
- [Bruh](/sound/bruh/), a complete sentence
- [Get Out (Tuco)](/sound/get-out-tuco/), perfectly timed with kicking someone from the call
- [Roblox Oof](/sound/roblox-oof/), [Nuh Uh](/sound/nuh-uh/) and [Bonk](/sound/bonk/), all comfortably under two seconds

More on the [Discord soundboard hub](/discord-soundboard/) and the [meme soundboard](/meme-soundboard/). New to all this? Start with [what a soundboard actually is](/blog/what-is-a-soundboard/).
