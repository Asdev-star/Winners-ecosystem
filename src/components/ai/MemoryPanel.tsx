// Phase 5 - Intelligence Layer
// Component: MemoryPanel
// Implements: AI Assistant Interaction Specification V2
// Transparent memory viewer/editor - users can see and edit what supervisors know about them

import { useState, useEffect } from "react";

interface MemoryItem {
  id: string;
  supervisor: string;
  category: string;
  content: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface MemoryPanelProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryPanel({ userId, isOpen, onClose }: MemoryPanelProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filter, setFilter] = useState<string>("all");

  // Fetch memories
  useEffect(() => {
    if (!isOpen || !userId) return;

    setIsLoading(true);
    fetch(`/api/v1/ai/memories?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setMemories(data.memories || []);
      })
      .catch(err => {
        console.error("Failed to fetch memories:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const filteredMemories = filter === "all" 
    ? memories 
    : memories.filter(m => m.supervisor.toLowerCase() === filter);

  const handleEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/ai/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      });
      
      if (res.ok) {
        setMemories(prev => 
          prev.map(m => m.id === id ? { ...m, content: editContent, updatedAt: new Date().toISOString() } : m)
        );
      }
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
    
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    
    try {
      const res = await fetch(`/api/v1/ai/memories/${id}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const supervisors = ["all", ...new Set(memories.map(m => m.supervisor))];

  return (
    <div
      className="memory-panel-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        className="memory-panel"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "var(--surface, #111D2E)",
          border: "1px solid var(--border, #1E3248)",
          borderRadius: "6px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border, #1E3248)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--gold, #C9A84C)",
                margin: 0
              }}
            >
              Memory Panel
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: "11px",
                color: "var(--text-dim, #5A7A96)",
                margin: "4px 0 0 0"
              }}
            >
              What supervisors know about you
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim, #5A7A96)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ×
          </button>
        </div>

        {/* Filter */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border, #1E3248)",
            display: "flex",
            gap: "8px",
            overflowX: "auto"
          }}
        >
          {supervisors.map(sup => (
            <button
              key={sup}
              onClick={() => setFilter(sup)}
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: filter === sup ? "var(--gold, #C9A84C)" : "var(--border, #1E3248)",
                backgroundColor: filter === sup ? "var(--gold, #C9A84C)" : "transparent",
                color: filter === sup ? "var(--bg, #0D1520)" : "var(--text-dim, #5A7A96)",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {sup === "all" ? "All" : sup}
            </button>
          ))}
        </div>

        {/* Memory List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px"
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
              Loading memories...
            </div>
          ) : filteredMemories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
              No memories found. Supervisors will create memories as they interact with you.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredMemories.map(item => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--surface2, #172335)",
                    border: "1px solid var(--border, #1E3248)",
                    borderRadius: "4px",
                    padding: "12px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px"
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          color: "var(--gold, #C9A84C)",
                          border: "1px solid var(--gold)",
                          borderRadius: "2px",
                          padding: "2px 6px"
                        }}
                      >
                        {item.supervisor}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                          fontSize: "9px",
                          color: "var(--text-dim)",
                          textTransform: "uppercase"
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--ice, #89C4E1)",
                          fontSize: "12px",
                          cursor: "pointer",
                          padding: "2px 6px"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--red, #E05A4E)",
                          fontSize: "12px",
                          cursor: "pointer",
                          padding: "2px 6px"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {editingId === item.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          backgroundColor: "var(--bg, #0D1520)",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          color: "var(--text)",
                          fontFamily: "var(--font-body)",
                          fontSize: "13px",
                          padding: "8px",
                          resize: "vertical"
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          onClick={() => handleSave(item.id)}
                          style={{
                            backgroundColor: "var(--green, #2DD4A0)",
                            color: "var(--bg)",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            backgroundColor: "transparent",
                            color: "var(--text-dim)",
                            border: "1px solid var(--border)",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        margin: 0,
                        lineHeight: 1.5
                      }}
                    >
                      {item.content}
                    </p>
                  )}
                  
                  <div
                    style={{
                      marginTop: "8px",
                      fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                      fontSize: "9px",
                      color: "var(--text-dim)"
                    }}
                  >
                    Confidence: {Math.round(item.confidence * 100)}% · Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            textAlign: "center"
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono, 'Space Mono', monospace)",
              fontSize: "10px",
              color: "var(--text-dim)",
              margin: 0
            }}
          >
            Memory is transparent and editable. Supervisors use this to personalise their responses.
          </p>
        </div>
      </div>
    </div>
  );
}
