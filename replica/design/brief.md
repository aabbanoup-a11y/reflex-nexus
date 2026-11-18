# AbanoupAI Visual Design Brief
**Date:** 2026-11-16  
**Status:** Approved implementation baseline recovered from the project's edit history.

## Product constraints
- Target quality date: 2026-11-25; a target, not a guarantee.
- One primary workspace. Secondary areas live in an openable sidebar.
- Mobile navigation uses a side drawer; no bottom-tab navigation.
- No Figma.
- Original app icon built around lowercase “a”.
- Professional, contemporary, uncluttered, neither simplistic nor visually crowded.
- Web and Android are separate applications with consistent visual language and equivalent core capabilities; Android is not a WebView shell.
- Material 3 Expressive direction, violet + cyan, dark and light themes, restrained motion, responsive layout, Arabic/English and RTL/LTR.

## Brand
Modern Intelligence: original geometric lowercase “a” mark, deep violet as primary, cyan as functional highlight, neutral surfaces for reading. Keep the launcher mark legible at small sizes and in monochrome. Wordmark is separate from the launcher mark.

## Design tokens
Roles: background, surface, border, input border, text, muted text, primary violet, cyan secondary, on-primary, success, warning, danger. Avoid decorating every element with both brand colors. Use accessible contrast: 4.5:1 body text; 3:1 large text and meaningful UI boundaries.

## Primary workspace
1. Header: AbanoupAI mark, current workspace/task title, model or Auto indicator, profile/status.
2. Conversation canvas: messages, citations, attachments, generated artifacts, tool events, progress.
3. Composer: multiline prompt, attachments, voice, mode selector, send/stop.
4. Inline progress: current plan and step, with collapsible tools, agents, sources and verification.
5. Result actions: copy, revise, retry, export/save, inspect sources.

## Sidebar information architecture
- Workspace: New chat, Chat history, Projects.
- Modes: Chat, Research, Agent/Work, Create, Code.
- Resources: Files & artifacts, Memory.
- Tools: Models, Integrations, Automations, Phone/Companion.
- System: Activity, Settings, Help.
Only show destinations that are implemented and available to the signed-in user. Planned features must not look active.

## Android
Use native UI (current Kotlin/View approach unless a later architecture review justifies Compose); never use WebView as the primary app shell. Drawer opens from the app bar. Keep composer above keyboard, request voice/phone permissions only when invoked, show local/cloud distinction, and keep emergency stop visible during active phone automation.

## Web
Sidebar stays visible on desktop and becomes a drawer on narrow screens. Desktop may use split conversation/artifact panels; mobile web uses one main surface. Core flows must not require keyboard shortcuts.

## QA
Test Android small screens and IME; web at 360, 390, tablet and desktop widths; light/dark; Arabic RTL and English LTR; text scaling; focus/hover/pressed/disabled/loading/empty/error/offline states; screen readers; touch targets; WCAG contrast.
