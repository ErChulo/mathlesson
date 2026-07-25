
/* v4.9.16: prevent Mermaid default DOM autostart before MathLesson applies visibility checks and fallbacks. */
try {
  if (window.mermaid && typeof window.mermaid.initialize === "function") {
    window.mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    window._mermaidInited = true;
  }
} catch (_) {}
