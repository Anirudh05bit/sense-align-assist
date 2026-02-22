import React, { useState } from 'react';

// Hardcode or use environment variable for Gemini API Key here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDdKq8tNRtGjf34PZKvT96CGCfGwbsmKYw";

const callGeminiAPI = async (text) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `You are a cognitive accessibility assistant. Your job is to take the following complex text and simplify it for someone who struggles with reading comprehension, memory, or focus (e.g., ADHD, dyslexia, cognitive decline).
    
IMPORTANT: You MUST respond ONLY with a valid JSON object. Do not wrap the JSON in markdown blocks like \`\`\`json. Just output the raw JSON string.

The JSON MUST have the following structure:
{
  "summary": "A 1-2 sentence extremely simple summary of what this text is about.",
  "bulletPoints": ["Key point 1 in simple terms", "Key point 2 in simple terms", "Key point 3 in simple terms"],
  "simplifiedText": "The full text rewritten to be completely plain language, short sentences, and easy to digest."
}

Text to simplify:
"""
${text}
"""`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3, // Low temperature for consistent JSON output
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to connect to AI.");
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
        throw new Error("AI returned an empty response.");
    }

    // Clean up potential markdown formatting if the LLM hallucinated it despite instructions
    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(resultText);
    } catch (e) {
        throw new Error("AI did not return valid JSON format. Try again.");
    }
};

const SmartSimplifier = () => {
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSimplify = async () => {
        if (!inputText.trim()) return;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            setError("Please add your Gemini API Key in the code (SmartSimplifier.jsx).");
            return;
        }

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await callGeminiAPI(inputText);
            setResult(res);
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred while simplifying the text.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl mb-2 text-gradient">Smart Text Simplifier</h2>
                    <p className="text-muted text-lg">Powered by real AI: Paste complex text below to convert it into easy-to-read info.</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Input Region */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <label className="font-heading mb-2 text-lg" style={{ fontWeight: 600, color: '#e8e8f0' }}>Complex Text Input</label>
                    <textarea
                        className="input-control mb-4"
                        rows="12"
                        placeholder="Paste your difficult text here... (e.g., legal documents, medical reports, dense academic papers)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        style={{
                            resize: 'vertical',
                            fontFamily: 'var(--font-body)',
                            minHeight: '200px',
                            background: 'rgba(0,0,0,0.2)',
                            color: '#e8e8f0',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSimplify}
                        disabled={loading || !inputText.trim()}
                        style={{ alignSelf: 'flex-start', opacity: (loading || !inputText.trim()) ? 0.5 : 1 }}
                    >
                        {loading ? '✨ Generating...' : '✨ Simplify with AI'}
                    </button>
                </div>

                {/* Output Region */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <label className="font-heading mb-4 text-lg" style={{ fontWeight: 600, color: '#e8e8f0' }}>AI Output</label>

                    {!result && !loading && (
                        <div className="flex flex-col items-center justify-center text-muted" style={{ flexGrow: 1, minHeight: '250px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>📄</span>
                            <p>Your simplified text will appear here.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center" style={{ flexGrow: 1, minHeight: '250px' }}>
                            <div className="spinner mb-4" style={{ borderTopColor: '#a78bfa', borderRightColor: 'rgba(167,139,250,0.2)', borderBottomColor: 'rgba(167,139,250,0.2)', borderLeftColor: 'rgba(167,139,250,0.2)' }}></div>
                            <p className="animate-pulse" style={{ color: '#a78bfa', fontWeight: 500 }}>Connecting... Analyzing complexity...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="animate-fade-in" style={{ flexGrow: 1 }}>
                            <div className="mb-6 card" style={{ background: 'rgba(167, 139, 250, 0.08)', borderColor: 'rgba(167, 139, 250, 0.2)', boxShadow: 'none' }}>
                                <h4 className="mb-2" style={{ color: '#c4b5fd' }}>💡 Quick Summary</h4>
                                <p className="cognitive-text" style={{ fontSize: '1.15rem', fontWeight: 500, color: '#e8e8f0' }}>{result.summary}</p>
                            </div>

                            <div className="mb-6 card" style={{ background: 'rgba(244, 114, 182, 0.08)', borderColor: 'rgba(244, 114, 182, 0.2)', boxShadow: 'none' }}>
                                <h4 className="mb-2" style={{ color: '#fbcfe8' }}>📌 Key Takeaways</h4>
                                <ul style={{ paddingLeft: '1.5rem', listStyleType: 'square' }} className="cognitive-text">
                                    {result.bulletPoints.map((bp, idx) => (
                                        <li key={idx} className="mb-2" style={{ color: '#e8e8f0' }}>{bp}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="card" style={{ background: 'rgba(52, 211, 153, 0.08)', borderColor: 'rgba(52, 211, 153, 0.2)', boxShadow: 'none' }}>
                                <h4 className="mb-2" style={{ color: '#6ee7b7' }}>📖 Easy Reading Version</h4>
                                <p className="cognitive-text" style={{ color: '#e8e8f0' }}>{result.simplifiedText}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartSimplifier;
