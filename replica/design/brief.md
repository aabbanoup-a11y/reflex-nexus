# AbanoubAI Visual Design Brief
**Date:** 2026-11-16  
**Status:** First design direction for review; not yet implemented.

## Confirmed product design constraints
- Quality target: professional and competitive with leading AI assistant products by **2026-11-25**. This is a target date, not a guarantee.
- One primary workspace/screen. All secondary areas live in the sidebar.
- Mobile navigation uses an openable side drawer; do not add bottom-tab navigation.
- Do not use Figma.
- App icon must be based on the lowercase letter **“a”**.
- Design should be beautiful, professional, contemporary, neither simplistic nor visually crowded.
- Web and Android remain separate applications with consistent visual language and equivalent core capabilities, not a shared WebView.
- Current proposed direction: Material 3 Expressive, Purple + Cyan, Dark and Light themes, restrained motion, responsive layout, Arabic/English and RTL/LTR.

## Brand and visual system
### Direction
**Modern Intelligence** — a distinctive AbanoubAI identity built around a custom lowercase “a” mark, deep violet as the primary brand role, cyan as a functional highlight, and neutral surfaces for long reading sessions.

### Logo / app icon
- Primary mark: custom geometric lowercase “a”; avoid copying any competitor icon.
- Icon must remain legible at launcher size and in monochrome.
- Do not place detailed gradients, text labels, or tiny decorative elements inside the launcher icon.
- Create a full wordmark separately for splash/about/marketing surfaces.
- Final icon artwork must be original and independently authored.

### Color roles (provisional, tune after contrast testing)
- `primary`: violet, used for primary actions and selected navigation.
- `secondary`: cyan, used for highlights, status and selected affordances.
- `background`: near-black in dark theme; soft neutral in light theme.
- `surface`: layered neutral cards/panels.
- `surface-container`: sidebar, composer and grouped sections.
- `text` / `text-muted`: high-contrast foreground hierarchy.
- `success`, `warning`, `danger`: semantic status colors only.
- Avoid using violet/cyan as decoration on every element; preserve whitespace and hierarchy.

### Typography and layout
- Use a modern open font with Arabic coverage, and verify Arabic shaping/diacritics in actual devices.
- Clear hierarchy: page title, task status, content, supporting metadata.
- Comfortable reading width on web; full-width responsive conversation on Android.
- Consistent 8dp spacing rhythm, moderate corner radius, subtle elevation, clear focus/pressed/disabled/loading states.
- Respect system font scaling, safe areas, keyboard/IME and screen reader semantics.

## Primary workspace
One main surface that adapts to the selected mode without becoming a dashboard full of cards:
1. **Header:** AbanoubAI mark, current workspace/task title, model or Auto indicator, profile/status.
2. **Conversation canvas:** user and assistant messages, citations, attachments, generated artifacts, tool events and agent progress.
3. **Composer:** multiline prompt, attach file, voice, mode selector, send/stop.
4. **Progress layer:** plan and current step shown inline when the assistant is working; collapsible details for tools, delegated agents, sources and verification.
5. **Result actions:** copy, revise, retry, export/save artifact, inspect sources.

## Sidebar information architecture
Keep secondary destinations grouped and searchable:
- **Workspace:** New chat, Chat history, Projects.
- **Modes:** Chat, Research, Agent/Work, Create, Code.
- **Resources:** Files & artifacts, Memory.
- **Tools:** Models, Integrations, Automations, Phone/Companion.
- **System:** Activity, Settings, Help.

Only show destinations that are actually implemented and available to the signed-in user. Planned features must not look active.

## Android-specific behavior
- Native Compose or current native UI approach after codebase inspection; no WebView as the primary app shell.
- Drawer opens from the app bar; gestures must not conflict with system back navigation.
- Composer remains reachable above the keyboard.
- Voice and phone-control permissions are requested only when the user invokes those functions, with clear explanations.
- Show connection state and local/cloud distinction without implying offline cloud capabilities.
- Persistent emergency stop when a phone automation session is active.

## Web-specific behavior
- Sidebar remains available on wide screens and becomes a drawer on narrow screens.
- Conversation and artifact panels can use a split layout on desktop, but collapse to a single main surface on mobile web.
- Keyboard shortcuts are discoverable and never required for core flows.

## Design QA checklist
- [ ] Android small-screen layout and keyboard behavior
- [ ] Web 360px, 390px, tablet and desktop widths
- [ ] Light and dark themes
- [ ] Arabic RTL and English LTR
- [ ] Text scaling and long translated labels
- [ ] Focus, hover, pressed, disabled, loading, empty, error and offline states
- [ ] WCAG contrast: 4.5:1 body text; 3:1 large text and meaningful UI boundaries
- [ ] Screen reader labels and touch target sizes
- [ ] No decorative complexity that competes with the conversation

## Review decision
This is a proposed design baseline derived from the user's previously stated constraints. Before implementing the visual shell, review the final primary workspace composition and exact theme values. Do not create Figma files.
