// src/features/intelligence/ai-platform/AIPlatformPage.tsx
// Phase 5 V2.0 - Winners Intelligence Multimodal Platform
// File uploads, multi-provider routing, multimodal AI interactions

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const PROVIDERS = [
  { id: "claude", name: "Claude 3.5 Sonnet", icon: "🧠", bestFor: "Reasoning, PDFs, Images", color: "#D97706" },
  { id: "gpt4o", name: "GPT-4o", icon: "🔮", bestFor: "Vision, Audio, Code", color: "#10B981" },
  { id: "gemini", name: "Gemini 1.5 Pro", icon: "🌟", bestFor: "Video, Long context", color: "#8B5CF6" },
  { id: "ollama", name: "Ollama (Local)", icon: "💻", bestFor: "Offline, Free, Privacy", color: "#06B6D4" },
];

const FILE_TYPES = [
  { type: "image", formats: "JPEG, PNG, GIF, WebP", icon: "🖼️", credits: 5 },
  { type: "pdf", formats: "PDF (any version)", icon: "📄", credits: 6 },
  { type: "audio", formats: "MP3, WAV, M4A, OGG", icon: "🎤", credits: 4 },
  { type: "video", formats: "MP4, WebM, MOV", icon: "🎬", credits: 10 },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ai-platform-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    padding: 24px;
  }

  .platform-header {
    margin-bottom: 32px;
  }
  
  .platform-header h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    font-weight: 300;
    margin: 0 0 8px;
    background: linear-gradient(135deg, var(--purple), var(--gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .platform-header p {
    color: var(--text-dim);
    font-size: 14px;
    margin: 0;
  }

  .context-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .ctx-badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .ctx-badge.live { border-color: var(--green); color: var(--green); }
  .ctx-badge.planned { opacity: 0.5; }
  .ctx-sep { color: var(--text-dim); align-self: center; }

  /* Main Layout */
  .platform-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
  }

  @media (max-width: 900px) {
    .platform-layout { grid-template-columns: 1fr; }
  }

  /* Chat Area */
  .chat-area {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    min-height: 500px;
  }

  .chat-area::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--purple), var(--gold));
    border-radius: 6px 6px 0 0;
  }

  .chat-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .current-provider {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .provider-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .provider-name {
    font-weight: 600;
    font-size: 14px;
  }

  .provider-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--surface2);
    color: var(--text-dim);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-message {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
  }

  .chat-message.user {
    align-self: flex-end;
    background: linear-gradient(135deg, var(--blue), #1E3D52);
    border-bottom-right-radius: 4px;
  }

  .chat-message.assistant {
    align-self: flex-start;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }

  .chat-input-area {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
  }

  /* File Drop Zone */
  .drop-zone {
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    margin-bottom: 16px;
    transition: all 0.2s;
    cursor: pointer;
  }

  .drop-zone:hover, .drop-zone.dragover {
    border-color: var(--purple);
    background: rgba(155, 111, 255, 0.05);
  }

  .drop-zone-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .drop-zone-text {
    font-size: 13px;
    color: var(--text-dim);
  }

  .drop-zone-formats {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 4px;
  }

  .file-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--surface2);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .file-preview-icon {
    font-size: 24px;
  }

  .file-preview-info {
    flex: 1;
  }

  .file-preview-name {
    font-size: 13px;
    font-weight: 600;
  }

  .file-preview-size {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .file-remove {
    background: none;
    border: none;
    color: var(--red);
    cursor: pointer;
    font-size: 18px;
  }

  .input-row {
    display: flex;
    gap: 12px;
  }

  .chat-input {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    color: var(--text);
    font-size: 14px;
    font-family: 'Syne', sans-serif;
    resize: none;
  }

  .chat-input:focus {
    outline: none;
    border-color: var(--purple);
  }

  .chat-send {
    background: linear-gradient(135deg, var(--purple), #7C3AED);
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    color: white;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .chat-send:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(155, 111, 255, 0.4);
  }

  /* Sidebar */
  .platform-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sidebar-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
  }

  .sidebar-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    margin-bottom: 12px;
  }

  .provider-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .provider-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .provider-option:hover {
    background: var(--surface2);
  }

  .provider-option.active {
    border-color: var(--gold);
    background: var(--surface2);
  }

  .provider-option-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .provider-option-info {
    flex: 1;
  }

  .provider-option-name {
    font-size: 12px;
    font-weight: 600;
  }

  .provider-option-best {
    font-size: 10px;
    color: var(--text-dim);
  }

  /* Credits */
  .credits-display {
    text-align: center;
    padding: 16px;
  }

  .credits-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 600;
    color: var(--gold);
  }

  .credits-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .credits-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .credits-btn {
    flex: 1;
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    transition: all 0.2s;
  }

  .credits-btn:hover {
    border-color: var(--gold);
  }

  .credits-btn.primary {
    background: var(--gold);
    color: var(--bg);
    border-color: var(--gold);
  }

  /* File Types Guide */
  .file-types {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .file-type-card {
    padding: 10px;
    border-radius: 6px;
    background: var(--surface2);
    text-align: center;
  }

  .file-type-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .file-type-name {
    font-size: 10px;
    font-weight: 600;
  }

  .file-type-credits {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--gold);
  }
`;

export default function AIPlatformPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProvider, setSelectedProvider] = useState("claude");
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    { role: "assistant", content: "Welcome to Winners AI Platform. Upload any file — images, PDFs, audio, or video — and I'll analyze it using the best AI provider for your needs." }
  ]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if (!message.trim() && !uploadedFile) return;

    const newMessages = [...messages, { role: "user", content: message }];
    if (uploadedFile) {
      newMessages[newMessages.length - 1].content += ` [Attached: ${uploadedFile.name}]`;
    }
    setMessages(newMessages);
    setMessage("");
    
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I've received your request. Processing with " + PROVIDERS.find(p => p.id === selectedProvider)?.name + "..." 
      }]);
    }, 1000);
  };

  return (
    <>
      <style>{css}</style>
      <div className="ai-platform-page">
        {/* Context Bar */}
        <div className="context-bar">
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🧑‍🤝‍🧑 Community</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🎓 Academy</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🛒 Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge live">🤖 Intelligence</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">💼 Work</span>
        </div>

        {/* Header */}
        <div className="platform-header">
          <h1>AI Platform</h1>
          <p>Multimodal AI — Send images, PDFs, audio, or video to any assistant.</p>
        </div>

        <div className="platform-layout">
          {/* Main Chat Area */}
          <div className="chat-area">
            <div className="chat-header">
              <div className="current-provider">
                <div 
                  className="provider-icon"
                  style={{ background: PROVIDERS.find(p => p.id === selectedProvider)?.color }}
                >
                  {PROVIDERS.find(p => p.id === selectedProvider)?.icon}
                </div>
                <div>
                  <div className="provider-name">
                    {PROVIDERS.find(p => p.id === selectedProvider)?.name}
                  </div>
                  <span className="provider-badge">
                    {PROVIDERS.find(p => p.id === selectedProvider)?.bestFor}
                  </span>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
            </div>

            <div className="chat-input-area">
              {/* File Drop Zone */}
              <div 
                className={`drop-zone ${isDragOver ? "dragover" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-zone-icon">📁</div>
                <div className="drop-zone-text">
                  Drop file here or click to upload
                </div>
                <div className="drop-zone-formats">
                  Images, PDFs, Audio, Video
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,audio/*,video/*"
                />
              </div>

              {uploadedFile && (
                <div className="file-preview">
                  <span className="file-preview-icon">
                    {uploadedFile.type.startsWith("image") ? "🖼️" : 
                     uploadedFile.type.startsWith("video") ? "🎬" :
                     uploadedFile.type.startsWith("audio") ? "🎤" : "📄"}
                  </span>
                  <div className="file-preview-info">
                    <div className="file-preview-name">{uploadedFile.name}</div>
                    <div className="file-preview-size">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button className="file-remove" onClick={removeFile}>×</button>
                </div>
              )}

              <div className="input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask anything... (or drop a file above)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button className="chat-send" onClick={handleSend}>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="platform-sidebar">
            {/* Credits */}
            <div className="sidebar-section">
              <div className="credits-display">
                <div className="credits-amount">2,500</div>
                <div className="credits-label">AI Credits</div>
                <div className="credits-actions">
                  <button className="credits-btn">Earn</button>
                  <button className="credits-btn primary">Buy</button>
                </div>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="sidebar-section">
              <div className="sidebar-title">AI Provider</div>
              <div className="provider-list">
                {PROVIDERS.map((provider) => (
                  <div
                    key={provider.id}
                    className={`provider-option ${selectedProvider === provider.id ? "active" : ""}`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div 
                      className="provider-option-icon"
                      style={{ background: provider.color }}
                    >
                      {provider.icon}
                    </div>
                    <div className="provider-option-info">
                      <div className="provider-option-name">{provider.name}</div>
                      <div className="provider-option-best">{provider.bestFor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Types */}
            <div className="sidebar-section">
              <div className="sidebar-title">Credits per File</div>
              <div className="file-types">
                {FILE_TYPES.map((ft) => (
                  <div key={ft.type} className="file-type-card">
                    <div className="file-type-icon">{ft.icon}</div>
                    <div className="file-type-name">{ft.type}</div>
                    <div className="file-type-credits">{ft.credits} credits</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
