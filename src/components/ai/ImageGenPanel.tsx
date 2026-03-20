import { useState, useEffect } from "react";

interface ImageGenPanelProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export default function ImageGenPanel({ onImageGenerated }: ImageGenPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setPromptId(null);

    try {
      const response = await fetch("/api/v1/ai-platform/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "sdxl" }),
      });

      if (!response.ok) throw new Error("Image generation failed");
      
      const data = await response.json();
      setPromptId(data.prompt_id);
      
      // Start polling for status
      if (data.prompt_id) {
        pollStatus(data.prompt_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsGenerating(false);
    }
  };

  const pollStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/ai-platform/images/status/${id}`);
      if (!response.ok) return;
      
      const status = await response.json();
      
      // Check if generation is finished
      if (status && status[id] && status[id].outputs) {
        // Mocking the result URL, as the current backend doesn't return the full URL yet
        // In a real scenario, this would be an actual file URL from ComfyUI
        const imageUrl = `http://localhost:8188/view?filename=${status[id].outputs.images[0].filename}`;
        setGeneratedImage(imageUrl);
        setIsGenerating(false);
        if (onImageGenerated) onImageGenerated(imageUrl);
      } else {
        // Poll again after 2 seconds
        setTimeout(() => pollStatus(id), 2000);
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Wait and retry
      setTimeout(() => pollStatus(id), 2000);
    }
  };

  return (
    <div className="image-gen-panel p-4 bg-gray-900 text-white rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🎨</span> HERALD Image Forge
      </h3>
      
      <div className="flex flex-col gap-4">
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Describe the image you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`py-3 px-6 rounded-md font-bold transition-all ${
            isGenerating 
            ? "bg-purple-900 cursor-not-allowed text-gray-400" 
            : "bg-purple-600 hover:bg-purple-500 active:scale-95"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg">⏳</span> Generating...
            </span>
          ) : (
            "Generate Image"
          )}
        </button>
        
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {generatedImage && (
          <div className="mt-4 animate-in fade-in duration-700">
            <p className="text-xs text-gray-400 mb-2">Generation complete:</p>
            <div className="relative group overflow-hidden rounded-lg">
              <img 
                src={generatedImage} 
                alt="AI Generated" 
                className="w-full h-auto object-cover max-h-[400px]"
                onLoad={() => console.log("Image loaded")}
                onError={(e) => {
                  console.error("Image load failed, showing placeholder");
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/512?text=Image+Generated+(Simulated)";
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button className="p-2 bg-white text-black rounded-full hover:bg-gray-200">💾</button>
                <button className="p-2 bg-white text-black rounded-full hover:bg-gray-200">📤</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
