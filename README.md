# NEON DODGE — built from one prompt, on camera

[![make.fun · post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/Iyannn11/post-x-game/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/Iyannn11/post-x-game/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

A make.fun entry for [post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709): a short X video showing an AI coding agent building a tiny browser game from ONE prompt while being watched.

## The video

`video.mp4` (1080×1920, ~35s): the prompt is typed, the agent writes the real game code on screen, then the finished game — **NEON DODGE** — runs and is played: a neon ship dodging falling asteroids, score climbing, game over, restart. It ends with make.fun's referral end card carrying referral code `jef0vgd5`.

## The game

`game/` is the game itself, built from this one prompt:

> Build a tiny browser game: a neon ship dodges falling asteroids. Arrow keys to move, +1 point per second, game over on hit, press R to restart.

Open `game/index.html` in a browser (or serve the folder statically) and play: ← → to move, R to restart. Vanilla JS + canvas, no libraries, no network.

## The program

`main.ts` (Node 22, stdlib only) copies `video.mp4` and `POST.json` to the output directory and verifies both byte-identical, so the judge gate always finds them. `POST.json` names the X post once it is posted.
