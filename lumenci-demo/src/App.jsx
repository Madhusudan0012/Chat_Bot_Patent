import React, { useState, useRef, useEffect } from "react";
import {
  Upload, FileText, Send, Check, X, Pencil, Undo2, Download,
  ShieldCheck, ShieldAlert, ShieldQuestion, Link2, ArrowRight,
  CircleDot, Sparkles
} from "lucide-react";

const STRENGTH = {
  strong: { label: "Strong", color: "#2F6B4F", bg: "#E7F0EA", Icon: ShieldCheck },
  moderate: { label: "Moderate", color: "#9C6B00", bg: "#FBF1DC", Icon: ShieldAlert },
  weak: { label: "Weak", color: "#A8433F", bg: "#F6E7E6", Icon: ShieldQuestion },
};

const initialRows = [
  {
    id: "e1",
    n: 1,
    element: "A temperature control device with a wireless communication module",
    evidence: `Acme Thermostat product page: "WiFi-enabled smart thermostat connects to your home network"`,
    reasoning: "The Acme device has WiFi capability which satisfies the wireless communication module requirement.",
    strength: "strong",
  },
  {
    id: "e2",
    n: 2,
    element: "A motion sensor for detecting occupancy",
    evidence: `Acme technical specifications: "Built-in motion sensor detects when people are home"`,
    reasoning: "Motion sensor explicitly named in specs; maps directly to the claimed occupancy-detection element.",
    strength: "strong",
  },
  {
    id: "e3",
    n: 3,
    element: "Machine learning algorithm that learns user temperature preferences over time",
    evidence: `Acme marketing materials: "Auto-Schedule learns your preferred temperatures"`,
    reasoning: "Learning behavior is described, but technical implementation is not disclosed. Needs stronger technical evidence.",
    strength: "weak",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function LumenciPrototype() {
  const [stage, setStage] = useState("setup"); // setup | workspace
  const [chartFile, setChartFile] = useState(null);
  const [docsFile, setDocsFile] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(
    "Be conservative with evidence. Prefer technical filings and spec sheets over marketing copy. If evidence is insufficient, ask before proceeding."
  );

  const [rows, setRows] = useState(initialRows);
  const [history, setHistory] = useState([]); // stack of previous row-states for undo
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [awaitingMapping, setAwaitingMapping] = useState(false); // clarifying-question mode
  const [awaitingUpload, setAwaitingUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [highlightRow, setHighlightRow] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function pushMessage(msg) {
    setMessages((m) => [...m, { id: uid(), ...msg }]);
  }

  function snapshotForUndo() {
    setHistory((h) => [...h, rows]);
  }

  function handleUndo() {
    if (history.length === 0) {
      pushMessage({ role: "ai", type: "text", text: "There's nothing to undo yet." });
      return;
    }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRows(prev);
    pushMessage({ role: "ai", type: "text", text: "Reverted the chart to its previous state." });
  }

  function startSession() {
    setStage("workspace");
    pushMessage({
      role: "ai",
      type: "text",
      text: "Chart loaded — 3 elements mapped against the Acme Thermostat. Element 3's evidence is flagged weak. Want me to strengthen it, or point me at another element?",
    });
  }

  function handleQuickReply(text) {
    setInput(text);
    setTimeout(() => handleSend(text), 0);
  }

  function handleSend(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    pushMessage({ role: "user", type: "text", text });
    setInput("");

    const lower = text.toLowerCase();

    if (awaitingMapping) {
      setAwaitingMapping(false);
      // user is answering "which element does this map to"
      snapshotForUndo();
      const newRow = {
        id: uid(),
        n: rows.length + 1,
        element: "A temperature sensor array for ambient measurement (new element)",
        evidence: `Acme technical specifications: "Multi-point temperature sensor array improves reading accuracy across rooms"`,
        reasoning: "Analyst identified this as a separate, previously uncharted claim element. Added as a new row pending analyst confirmation of the patent claim language.",
        strength: "moderate",
      };
      setRows((r) => [...r, newRow]);
      setHighlightRow(newRow.id);
      pushMessage({
        role: "ai",
        type: "text",
        text: "Added it as a new element (row 4), since it doesn't fit the existing three. Flagged as moderate strength — the spec sheet supports it, but you may want to confirm this matches specific claim language before relying on it.",
      });
      return;
    }

    if (awaitingUpload) {
      setAwaitingUpload(false);
      snapshotForUndo();
      setRows((r) =>
        r.map((row) =>
          row.id === "e3"
            ? {
                ...row,
                evidence: `Uploaded doc "Acme_ML_Whitepaper.pdf": "The Auto-Schedule model is a gradient-boosted regression trained nightly on 30 days of occupancy and setpoint history."`,
                reasoning:
                  "The uploaded whitepaper discloses a specific trained model architecture, directly satisfying the claimed 'learns... over time' requirement with concrete technical detail.",
                strength: "strong",
              }
            : row
        )
      );
      setHighlightRow("e3");
      pushMessage({
        role: "ai",
        type: "text",
        text: "Thanks — that whitepaper gives me what I needed. Updated element 3 with the disclosed model details and raised the evidence strength to Strong.",
      });
      return;
    }

    // Scenario: strengthen ML / element 3 evidence
    if (lower.includes("strengthen") && (lower.includes("ml") || lower.includes("algorithm") || lower.includes("learn") || lower.includes("element 3"))) {
      pushMessage({
        role: "ai",
        type: "suggestion",
        targetId: "e3",
        text: "I found a stronger source than the marketing copy — Acme's published patent filing (US-App-2023/0145xxx) discloses the actual technical mechanism:",
        proposed: {
          evidence: `Patent filing US-App-2023/0145xxx: "a neural network trained on occupancy and temperature history to predict user setpoint preferences"`,
          reasoning: "A disclosed neural network trained on historical data directly matches the claimed 'algorithm that learns... over time' — a technical filing carries more weight than promotional language.",
          strength: "strong",
        },
      });
      return;
    }

    // Scenario: add missing feature
    if (lower.includes("miss") || lower.includes("sensor array") || (lower.includes("add") && lower.includes("temperature"))) {
      setAwaitingMapping(true);
      pushMessage({
        role: "ai",
        type: "question",
        text: "Good catch — that's not in the current chart. Which claim element should this map to?",
        options: ["It's a new, separate element", "Part of element 1 (temperature control device)"],
      });
      return;
    }

    // Fallback: AI cannot find evidence
    setAwaitingUpload(true);
    pushMessage({
      role: "ai",
      type: "upload-request",
      text: "I couldn't find sufficient evidence for that in the documents I have. Could you upload the relevant technical documentation, or paste a URL, and I'll take another pass?",
    });
  }

  function acceptSuggestion(msg) {
    snapshotForUndo();
    setRows((r) => r.map((row) => (row.id === msg.targetId ? { ...row, ...msg.proposed } : row)));
    setHighlightRow(msg.targetId);
    setMessages((m) => m.map((mm) => (mm.id === msg.id ? { ...mm, resolved: "accepted" } : mm)));
    pushMessage({ role: "ai", type: "text", text: "Applied — element 3 is updated in the chart." });
  }

  function rejectSuggestion(msg) {
    setMessages((m) => m.map((mm) => (mm.id === msg.id ? { ...mm, resolved: "rejected" } : mm)));
    pushMessage({
      role: "ai",
      type: "text",
      text: "No problem — left the chart unchanged. Let me know what direction you'd like instead.",
    });
  }

  useEffect(() => {
    if (!highlightRow) return;
    const t = setTimeout(() => setHighlightRow(null), 1800);
    return () => clearTimeout(t);
  }, [highlightRow]);

  return (
    <div className="lc-root">
      <style>{`
        .lc-root {
          --ink: #1C2333;
          --ink-soft: #545C6B;
          --paper: #EDEFF3;
          --panel: #FFFFFF;
          --border: #D7DBE2;
          --brass: #9C7A3C;
          --brass-soft: #F3ECDD;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .lc-root * { box-sizing: border-box; }
        .lc-serif { font-family: 'Source Serif 4', 'Georgia', serif; }
        .lc-mono { font-family: 'IBM Plex Mono', monospace; }

        .lc-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; background: var(--ink); color: #fff;
        }
        .lc-brand { display:flex; align-items:center; gap:10px; }
        .lc-seal {
          width: 26px; height: 26px; border-radius: 50%;
          border: 1.5px solid var(--brass); display:flex; align-items:center; justify-content:center;
          color: var(--brass); flex-shrink:0;
        }
        .lc-brand-name { font-family:'Source Serif 4', serif; font-size: 17px; letter-spacing: 0.02em; }
        .lc-brand-sub { font-size: 11px; color: #B7BECC; letter-spacing: 0.04em; text-transform: uppercase; }

        /* setup screen */
        .lc-setup-wrap { flex:1; display:flex; align-items:center; justify-content:center; padding: 40px 20px; }
        .lc-setup-card {
          background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
          padding: 32px; width: 100%; max-width: 560px;
        }
        .lc-setup-title { font-family:'Source Serif 4', serif; font-size: 22px; margin: 0 0 4px; }
        .lc-setup-sub { color: var(--ink-soft); font-size: 13.5px; margin: 0 0 24px; }
        .lc-field-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft);
          margin-bottom: 6px; display:block; font-weight: 600;
        }
        .lc-field { margin-bottom: 18px; }
        .lc-upload-btn {
          display:flex; align-items:center; gap:8px; width:100%; padding: 11px 14px;
          border: 1px dashed var(--border); border-radius: 5px; background: #FAFBFC;
          font-size: 13.5px; color: var(--ink-soft); cursor:pointer; transition: border-color .15s;
        }
        .lc-upload-btn:hover { border-color: var(--brass); }
        .lc-upload-btn.done { border-style: solid; border-color: #2F6B4F; color: var(--ink); background: #F2F7F4; }
        .lc-textarea {
          width:100%; border: 1px solid var(--border); border-radius: 5px; padding: 10px 12px;
          font-size: 13.5px; font-family: inherit; resize: vertical; min-height: 64px; color: var(--ink);
        }
        .lc-primary-btn {
          width:100%; padding: 11px; border-radius: 5px; border:none; background: var(--ink); color:#fff;
          font-size: 14px; font-weight: 600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition: background .15s;
        }
        .lc-primary-btn:hover { background: #2C3547; }

        /* workspace */
        .lc-workspace { flex:1; display:flex; min-height:0; }
        .lc-chart-pane { flex: 1.35; padding: 20px; overflow-y:auto; border-right: 1px solid var(--border); }
        .lc-chart-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
        .lc-chart-title { font-family:'Source Serif 4', serif; font-size:18px; margin:0; }
        .lc-chart-meta { font-size: 12px; color: var(--ink-soft); margin-top:2px; }
        .lc-toolbtn {
          display:flex; align-items:center; gap:6px; font-size: 12.5px; padding: 7px 12px;
          border: 1px solid var(--border); border-radius: 5px; background:#fff; cursor:pointer; color: var(--ink);
        }
        .lc-toolbtn:hover { border-color: var(--brass); }
        .lc-toolbar { display:flex; gap:8px; }

        .lc-row-card {
          background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
          padding: 16px; margin-bottom: 12px; transition: box-shadow .3s, border-color .3s;
        }
        .lc-row-card.hl { border-color: var(--brass); box-shadow: 0 0 0 3px var(--brass-soft); }
        .lc-row-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
        .lc-row-num { font-family:'IBM Plex Mono', monospace; font-size: 11px; color: var(--brass); font-weight:600; }
        .lc-row-element { font-size: 14px; font-weight: 600; margin: 2px 0 0; line-height:1.4; }
        .lc-strength-chip {
          display:flex; align-items:center; gap:5px; padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing:0.02em; flex-shrink:0; white-space:nowrap;
        }
        .lc-row-block { margin-top: 10px; }
        .lc-row-label { font-size: 10px; text-transform:uppercase; letter-spacing:0.05em; color: var(--ink-soft); font-weight:700; margin-bottom:4px; }
        .lc-row-evidence { font-family:'IBM Plex Mono', monospace; font-size: 12px; background:#F7F8FA; border-left: 2px solid var(--border); padding: 8px 10px; line-height:1.5; color:#2C3547; }
        .lc-row-reasoning { font-size: 13px; color: var(--ink-soft); line-height:1.5; }

        /* chat pane */
        .lc-chat-pane { flex: 1; display:flex; flex-direction:column; min-height:0; }
        .lc-chat-header { padding: 16px 18px 12px; border-bottom: 1px solid var(--border); }
        .lc-chat-title { font-family:'Source Serif 4', serif; font-size:16px; margin:0; display:flex; align-items:center; gap:7px; }
        .lc-chat-scroll { flex:1; overflow-y:auto; padding: 16px 18px; display:flex; flex-direction:column; gap:12px; }
        .lc-msg-user { align-self:flex-end; max-width: 82%; background: var(--ink); color:#fff; padding: 9px 13px; border-radius: 10px 10px 2px 10px; font-size: 13.5px; line-height:1.45; }
        .lc-msg-ai { align-self:flex-start; max-width: 92%; font-size: 13.5px; line-height:1.5; color: var(--ink); }
        .lc-ai-bubble { background:#F5F6F8; border: 1px solid var(--border); padding: 10px 13px; border-radius: 2px 10px 10px 10px; }

        .lc-suggestion-card { border: 1px solid var(--brass); border-radius: 6px; overflow:hidden; margin-top:6px; background:#fff; }
        .lc-suggestion-head { background: var(--brass-soft); padding: 7px 12px; font-size: 11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#7A5F2E; display:flex; align-items:center; gap:6px; }
        .lc-suggestion-body { padding: 11px 13px; font-size: 12.5px; }
        .lc-suggestion-diff { background:#F7F8FA; border-left:2px solid var(--brass); padding: 8px 10px; font-family:'IBM Plex Mono', monospace; font-size:11.5px; margin: 8px 0; line-height:1.5; }
        .lc-suggestion-actions { display:flex; gap:8px; padding: 0 13px 12px; }
        .lc-accept-btn, .lc-reject-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding: 7px 0;
          border-radius: 5px; font-size:12.5px; font-weight:600; cursor:pointer; border:1px solid transparent;
        }
        .lc-accept-btn { background:#2F6B4F; color:#fff; }
        .lc-reject-btn { background:#fff; color: var(--ink-soft); border-color: var(--border); }
        .lc-resolved { padding: 8px 13px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; }
        .lc-resolved.accepted { color:#2F6B4F; } .lc-resolved.rejected { color: var(--ink-soft); }

        .lc-option-btn {
          display:block; width:100%; text-align:left; padding: 8px 12px; margin-top:6px;
          border: 1px solid var(--border); border-radius: 5px; background:#fff; font-size:12.5px; cursor:pointer;
        }
        .lc-option-btn:hover { border-color: var(--brass); background: var(--brass-soft); }

        .lc-upload-inline { display:flex; gap:8px; margin-top:8px; }
        .lc-upload-inline button {
          display:flex; align-items:center; gap:5px; font-size:12px; padding:7px 10px; border-radius:5px;
          border:1px solid var(--border); background:#fff; cursor:pointer;
        }

        .lc-chat-input-row { display:flex; gap:8px; padding: 12px 16px; border-top: 1px solid var(--border); }
        .lc-chat-input {
          flex:1; border:1px solid var(--border); border-radius: 20px; padding: 9px 15px; font-size:13.5px; font-family:inherit;
        }
        .lc-send-btn {
          width: 38px; height: 38px; border-radius: 50%; border:none; background: var(--ink); color:#fff;
          display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;
        }

        .lc-quickreplies { display:flex; flex-wrap:wrap; gap:6px; padding: 0 16px 10px; }
        .lc-quickreply {
          font-size: 11.5px; padding: 6px 10px; border-radius: 14px; border: 1px solid var(--border);
          background:#fff; cursor:pointer; color: var(--ink-soft);
        }
        .lc-quickreply:hover { border-color: var(--brass); color: var(--ink); }

        .lc-toast {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color:#fff; padding: 10px 18px; border-radius: 6px; font-size: 13px;
          display:flex; align-items:center; gap:8px; box-shadow: 0 6px 18px rgba(0,0,0,0.2); z-index: 50;
        }
      `}</style>

      <div className="lc-topbar">
        <div className="lc-brand">
          <div className="lc-seal"><CircleDot size={14} /></div>
          <div>
            <div className="lc-brand-name">Lumenci Assistant</div>
            <div className="lc-brand-sub">Claim Chart Refinement</div>
          </div>
        </div>
        {stage === "workspace" && (
          <div style={{ fontSize: 12, color: "#B7BECC" }}>Patent US123456 · Acme Corp Thermostat</div>
        )}
      </div>

      {stage === "setup" && (
        <div className="lc-setup-wrap">
          <div className="lc-setup-card">
            <h2 className="lc-setup-title">Start a refinement session</h2>
            <p className="lc-setup-sub">Upload the claim chart and any supporting product documentation, then set how the assistant should behave.</p>

            <div className="lc-field">
              <span className="lc-field-label">Claim chart</span>
              <div
                className={`lc-upload-btn ${chartFile ? "done" : ""}`}
                onClick={() => setChartFile("US123456_v_Acme_ClaimChart.xlsx")}
              >
                {chartFile ? <FileText size={15} /> : <Upload size={15} />}
                {chartFile || "Choose file — claim chart (.xlsx, .docx)"}
              </div>
            </div>

            <div className="lc-field">
              <span className="lc-field-label">Product documentation (optional)</span>
              <div
                className={`lc-upload-btn ${docsFile ? "done" : ""}`}
                onClick={() => setDocsFile("Acme_Thermostat_TechSpec.pdf")}
              >
                {docsFile ? <FileText size={15} /> : <Upload size={15} />}
                {docsFile || "Choose file — spec sheets, filings, teardown reports"}
              </div>
            </div>

            <div className="lc-field">
              <span className="lc-field-label">Instructions for the assistant</span>
              <textarea className="lc-textarea" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
            </div>

            <button className="lc-primary-btn" onClick={startSession}>
              Start refinement session <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {stage === "workspace" && (
        <div className="lc-workspace">
          <div className="lc-chart-pane">
            <div className="lc-chart-header">
              <div>
                <h3 className="lc-chart-title">Claim Chart</h3>
                <div className="lc-chart-meta">{rows.length} elements · {rows.filter(r => r.strength === "weak").length} flagged weak</div>
              </div>
              <div className="lc-toolbar">
                <button className="lc-toolbtn" onClick={handleUndo}><Undo2 size={13} /> Undo</button>
                <button className="lc-toolbtn" onClick={() => setToast("Exported — US123456_v_Acme_ClaimChart_v2.docx")}><Download size={13} /> Export to Word</button>
              </div>
            </div>

            {rows.map((row) => {
              const s = STRENGTH[row.strength];
              return (
                <div key={row.id} className={`lc-row-card ${highlightRow === row.id ? "hl" : ""}`}>
                  <div className="lc-row-top">
                    <div>
                      <div className="lc-row-num">ELEMENT {row.n}</div>
                      <p className="lc-row-element">{row.element}</p>
                    </div>
                    <div className="lc-strength-chip" style={{ background: s.bg, color: s.color }}>
                      <s.Icon size={12} /> {s.label}
                    </div>
                  </div>
                  <div className="lc-row-block">
                    <div className="lc-row-label">Evidence</div>
                    <div className="lc-row-evidence">{row.evidence}</div>
                  </div>
                  <div className="lc-row-block">
                    <div className="lc-row-label">AI Reasoning</div>
                    <div className="lc-row-reasoning">{row.reasoning}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lc-chat-pane">
            <div className="lc-chat-header">
              <h3 className="lc-chat-title"><Sparkles size={14} /> Refinement chat</h3>
            </div>

            <div className="lc-chat-scroll" ref={scrollRef}>
              {messages.map((m) => {
                if (m.role === "user") {
                  return <div key={m.id} className="lc-msg-user">{m.text}</div>;
                }
                if (m.type === "text") {
                  return <div key={m.id} className="lc-msg-ai"><div className="lc-ai-bubble">{m.text}</div></div>;
                }
                if (m.type === "suggestion") {
                  return (
                    <div key={m.id} className="lc-msg-ai" style={{ width: "100%" }}>
                      <div className="lc-ai-bubble">{m.text}</div>
                      <div className="lc-suggestion-card">
                        <div className="lc-suggestion-head"><Pencil size={11} /> Proposed change · Element 3</div>
                        <div className="lc-suggestion-body">
                          <div className="lc-suggestion-diff">{m.proposed.evidence}</div>
                          <div style={{ color: "#545C6B" }}>{m.proposed.reasoning}</div>
                        </div>
                        {m.resolved ? (
                          <div className={`lc-resolved ${m.resolved}`}>
                            {m.resolved === "accepted" ? <><Check size={13}/> Accepted and applied</> : <><X size={13}/> Rejected — chart unchanged</>}
                          </div>
                        ) : (
                          <div className="lc-suggestion-actions">
                            <div className="lc-accept-btn" onClick={() => acceptSuggestion(m)}><Check size={13} /> Accept</div>
                            <div className="lc-reject-btn" onClick={() => rejectSuggestion(m)}><X size={13} /> Reject</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                if (m.type === "question") {
                  return (
                    <div key={m.id} className="lc-msg-ai">
                      <div className="lc-ai-bubble">
                        {m.text}
                        {m.options.map((o) => (
                          <button key={o} className="lc-option-btn" onClick={() => handleQuickReply(o)}>{o}</button>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (m.type === "upload-request") {
                  return (
                    <div key={m.id} className="lc-msg-ai">
                      <div className="lc-ai-bubble">
                        {m.text}
                        <div className="lc-upload-inline">
                          <button onClick={() => handleQuickReply("Uploaded Acme_ML_Whitepaper.pdf")}><Upload size={12}/> Upload document</button>
                          <button onClick={() => handleQuickReply("Uploaded Acme_ML_Whitepaper.pdf")}><Link2 size={12}/> Paste URL</button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="lc-quickreplies">
              <div className="lc-quickreply" onClick={() => handleQuickReply("Strengthen the evidence for the ML algorithm element")}>Strengthen ML evidence</div>
              <div className="lc-quickreply" onClick={() => handleQuickReply("AI missed the temperature sensor array")}>Flag missing feature</div>
              <div className="lc-quickreply" onClick={() => handleQuickReply("Find evidence for seasonal auto-adjustment")}>Ask about uncharted claim</div>
            </div>

            <div className="lc-chat-input-row">
              <input
                className="lc-chat-input"
                placeholder="Ask the assistant to refine an element..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button className="lc-send-btn" onClick={() => handleSend()}><Send size={15} /></button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="lc-toast"><Check size={14} /> {toast}</div>}
    </div>
  );
}
