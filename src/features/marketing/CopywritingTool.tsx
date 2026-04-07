import React, { useState } from "react";
import { useAuthStore } from "../auth/authStore";

interface CopywritingPrompt {
  id: string;
  title: string;
  description: string;
  template: string;
  category: string;
}

const CopywritingTool: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedPrompt, setSelectedPrompt] =
    useState<CopywritingPrompt | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedCopy, setGeneratedCopy] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const prompts: CopywritingPrompt[] = [
    {
      id: "social-media-post",
      title: "Social Media Post",
      description: "Create engaging social media content",
      category: "Social Media",
      template: `Create a compelling social media post for:
- Platform: {platform}
- Brand/Product: {brand}
- Target Audience: {audience}
- Key Message: {message}
- Call to Action: {cta}
- Tone: {tone}

Generate 3 variations of the post copy.`,
    },
    {
      id: "email-subject",
      title: "Email Subject Lines",
      description: "Craft attention-grabbing email subjects",
      category: "Email Marketing",
      template: `Generate 10 high-converting email subject lines for:
- Email Type: {emailType}
- Product/Service: {product}
- Target Audience: {audience}
- Key Benefit: {benefit}
- Urgency Level: {urgency}

Make them personalized and compelling.`,
    },
    {
      id: "ad-copy",
      title: "Facebook/Google Ads",
      description: "Write conversion-focused ad copy",
      category: "Paid Ads",
      template: `Create Facebook/Google ad copy for:
- Campaign Goal: {goal}
- Product/Service: {product}
- Target Audience: {audience}
- Unique Selling Point: {usp}
- Budget: {budget}

Include headlines, descriptions, and call-to-action variations.`,
    },
    {
      id: "landing-page",
      title: "Landing Page Copy",
      description: "Write persuasive landing page content",
      category: "Web Copy",
      template: `Write landing page copy for:
- Headline: {headline}
- Subheadline: {subheadline}
- Product/Service: {product}
- Key Benefits: {benefits}
- Social Proof: {proof}
- Call to Action: {cta}

Make it conversion-optimized and benefit-focused.`,
    },
    {
      id: "product-description",
      title: "Product Descriptions",
      description: "Create compelling product descriptions",
      category: "E-commerce",
      template: `Write a product description for:
- Product Name: {productName}
- Key Features: {features}
- Target Customer: {customer}
- Benefits: {benefits}
- Price Point: {price}
- Brand Voice: {voice}

Make it SEO-friendly and persuasive.`,
    },
  ];

  const handlePromptSelect = (prompt: CopywritingPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({});
    setGeneratedCopy("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateCopy = async () => {
    if (!selectedPrompt) return;

    setLoading(true);
    try {
      // Extract variables from template
      const variables = selectedPrompt.template.match(/\{(\w+)\}/g) || [];
      const uniqueVars = [...new Set(variables.map((v) => v.slice(1, -1)))];

      // Check if all required fields are filled
      const missingFields = uniqueVars.filter((v) => !formData[v]);
      if (missingFields.length > 0) {
        alert(`Please fill in: ${missingFields.join(", ")}`);
        return;
      }

      // Replace variables in template
      let promptText = selectedPrompt.template;
      uniqueVars.forEach((variable) => {
        promptText = promptText.replace(
          new RegExp(`\\{${variable}\\}`, "g"),
          formData[variable],
        );
      });

      // Here you would call your AI API
      // For now, we'll simulate a response
      const mockResponse = `Here's your generated copy based on the prompt:

${promptText}

[AI-generated content would appear here based on the template and your inputs]`;

      setGeneratedCopy(mockResponse);
    } catch (error) {
      console.error("Error generating copy:", error);
      setGeneratedCopy("Error generating copy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCopy);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <div className="copywriting-tool">
      <div className="tool-header">
        <h1>✍️ AI Copywriting Tool</h1>
        <p>Generate high-converting copy for your marketing campaigns</p>
      </div>

      <div className="tool-content">
        <div className="prompts-section">
          <h2>Choose a Template</h2>
          <div className="prompts-grid">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`prompt-card ${selectedPrompt?.id === prompt.id ? "selected" : ""}`}
                onClick={() => handlePromptSelect(prompt)}
              >
                <div className="prompt-category">{prompt.category}</div>
                <h3>{prompt.title}</h3>
                <p>{prompt.description}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedPrompt && (
          <div className="generator-section">
            <h2>{selectedPrompt.title}</h2>
            <div className="form-fields">
              {(() => {
                const variables =
                  selectedPrompt.template.match(/\{(\w+)\}/g) || [];
                const uniqueVars = [
                  ...new Set(variables.map((v) => v.slice(1, -1))),
                ];

                return uniqueVars.map((variable) => (
                  <div key={variable} className="form-field">
                    <label htmlFor={variable}>
                      {variable
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </label>
                    {variable.includes("audience") ||
                    variable.includes("benefits") ||
                    variable.includes("features") ? (
                      <textarea
                        id={variable}
                        value={formData[variable] || ""}
                        onChange={(e) =>
                          handleInputChange(variable, e.target.value)
                        }
                        placeholder={`Enter ${variable.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        id={variable}
                        value={formData[variable] || ""}
                        onChange={(e) =>
                          handleInputChange(variable, e.target.value)
                        }
                        placeholder={`Enter ${variable.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                      />
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="generate-section">
              <button
                className="btn-generate"
                onClick={generateCopy}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Copy"}
              </button>
            </div>

            {generatedCopy && (
              <div className="results-section">
                <div className="results-header">
                  <h3>Generated Copy</h3>
                  <button className="btn-copy" onClick={copyToClipboard}>
                    📋 Copy
                  </button>
                </div>
                <div className="generated-copy">
                  {generatedCopy.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .copywriting-tool {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tool-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .tool-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .tool-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
        }

        .prompts-section h2 {
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .prompts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .prompt-card {
          border: 2px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .prompt-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .prompt-card.selected {
          border-color: var(--primary);
          background: var(--light-bg);
        }

        .prompt-category {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .prompt-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .prompt-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .generator-section {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
        }

        .generator-section h2 {
          margin-top: 0;
          margin-bottom: 2rem;
          color: var(--text-primary);
        }

        .form-fields {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-field input,
        .form-field textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .generate-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .btn-generate {
          background: var(--primary);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-generate:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }

        .btn-generate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results-section {
          border-top: 1px solid var(--border);
          padding-top: 2rem;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .results-header h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .btn-copy {
          background: var(--secondary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .generated-copy {
          background: var(--light-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
          line-height: 1.6;
        }

        .generated-copy p {
          margin: 0 0 1rem 0;
        }

        .generated-copy p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .tool-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CopywritingTool;
