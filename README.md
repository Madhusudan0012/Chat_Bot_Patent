# Lumenci Assistant — Claim Chart Refinement (Prototype)

An AI-chat-based prototype for refining patent claim charts. Analysts upload a claim chart and supporting product documentation, then use conversational prompts to strengthen evidence, fix vague reasoning, flag missed claim elements, and export the refined chart to Word.

Built as a take-home prototype — see [Scope & Design Decisions](#scope--design-decisions) below for what's real vs. scripted.

**Live demo:** [velvety-druid-d627df.netlify.app](https://velvety-druid-d627df.netlify.app)

## Features

- **Setup flow** — upload a claim chart + product docs, set instructions for how the assistant should behave
- **3-column claim chart** — Claim Element / Evidence / AI Reasoning, with a color-coded evidence-strength indicator (Strong / Moderate / Weak) on every row
- **Chat-based refinement**, modeled on Word's tracked-changes review rather than plain chat replies:
  - *Strengthen evidence* — assistant proposes a stronger source, shown as an accept/reject card tied to the specific row
  - *Add missing feature* — assistant asks which claim element it maps to before creating a new row, rather than guessing
  - *Evidence not found* — assistant asks the analyst to upload a document or paste a URL instead of fabricating a citation
- **Undo** — reverts the chart to its state before the last accepted change
- **Export to Word** — mocked export confirmation

## Tech Stack

- React (functional components + hooks, no external state library)
- [lucide-react](https://lucide.dev/) for icons
- Plain CSS (scoped via a `<style>` block) — no CSS framework dependency

## Getting Started

```bash
npm install
npm install lucide-react
npm start
```

Opens at `http://localhost:3000` (Create React App) or `http://localhost:5173` (Vite), depending on your setup.

> If `lucide-react` isn't found, run `npm install lucide-react` explicitly — it isn't part of the base React template.

### Try it

On the setup screen, click through the two upload buttons and hit **Start refinement session**. In the chat panel, use the quick-reply chips or type freely:

| Try typing | Triggers |
|---|---|
| "Strengthen the evidence for the ML algorithm element" | Strengthen-evidence flow → accept/reject card on Element 3 |
| "AI missed the temperature sensor array" | Clarifying question → adds a new row on confirmation |
| Anything else | Falls back to the "can't find evidence" flow → requests an upload/URL |

## Scope & Design Decisions

This is a **prototype**, not a production system. A few things are intentionally scripted rather than wired to a real backend:

- **No live LLM call.** Chat responses use keyword-matched, pre-written logic for three core scenarios. A production version would call an LLM with retrieval over the uploaded documents, keeping the same "ask before guessing" behavior.
- **No persistence or auth.** State lives in React memory and resets on reload, per the assignment's scope.
- **Uploads are simulated.** Clicking "upload" sets a filename in state; no file is actually parsed.

Key product decisions behind the UI (also covered in the PRD):
1. **Evidence-strength grading** is surfaced on every row — the assistant's confidence should be explicit, since overstated evidence in a legal work product is a real risk, not just a UX nicety.
2. **The assistant asks before acting** on ambiguous input (unmapped features, insufficient evidence) instead of guessing.
3. **Refinements are accept/reject proposals**, not silent edits — mirrors the Word-based review workflow analysts already use and preserves an audit trail.

## Related Artifacts

- `lumenci-prototype.jsx` — this prototype
- User flow diagram (Mermaid) — covers the happy path plus 3 edge cases: wrong evidence, undo, evidence not found
- `Lumenci_Assistant_PRD.docx` — one-page PRD covering problem statement, user stories, scope, key decisions, acceptance criteria, and success metrics
