import React, { useState } from 'react';

// Hardcode or use environment variable for Gemini API Key here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDdKq8tNRtGjf34PZKvT96CGCfGwbsmKYw";

const callGeminiExtractAPI = async (text) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `You are a cognitive accessibility assistant. Extract the most important facts, definitions, and rules from the following text to create memory flashcards.
    
IMPORTANT: You MUST respond ONLY with a valid JSON array. Do not wrap the JSON in markdown blocks. Output the raw JSON array string.

The JSON MUST be an array of objects with this structure:
[
  { "id": 1, "type": "Definition", "title": "Short Title", "content": "The definition or explanation." },
  { "id": 2, "type": "Key Point", "title": "Main Idea", "content": "Important detail to remember." },
  { "id": 3, "type": "Rule", "title": "Process/Rule", "content": "A specific rule or step mentioned." }
]

Keep the content concise. Extract at least 3, and at most 6 cards. Allowed types: 'Definition', 'Key Point', 'Rule'.

Text to extract from:
"""
${text}
"""`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to connect to AI API.");
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("AI returned an empty response.");

    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(resultText);
        // Ensure unique IDs
        return parsed.map((card, idx) => ({ ...card, id: Date.now() + idx }));
    } catch (e) {
        throw new Error("AI did not return valid JSON format. Try again.");
    }
};

const Flashcard = ({ card }) => {
    const [flipped, setFlipped] = useState(false);

    const typeColor = card.type === 'Definition' ? 'var(--color-primary)'
        : card.type === 'Key Point' ? 'var(--color-success)'
            : 'var(--color-secondary)';

    return (
        <div
            style={{ perspective: '1000px', height: '280px', width: '100%', cursor: 'pointer' }}
            onClick={() => setFlipped(!flipped)}
        >
            <div style={{
                position: 'relative', width: '100%', height: '100%',
                transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
                {/* Front */}
                <div className="glass-panel" style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.1)', background: 'rgba(20,25,40,0.5)'
                }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '12px', background: `${typeColor}1A`, color: typeColor }}>
                        {card.type}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', color: '#e8e8f0', padding: '0 1rem' }}>{card.title}</h3>
                    <div className="text-muted mt-6 text-sm flex items-center gap-2">
                        <span>👆</span> Click to reveal
                    </div>
                </div>

                {/* Back */}
                <div className="glass-panel" style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    background: 'rgba(15,18,30,0.95)', border: `2px solid ${typeColor}`,
                    boxShadow: `0 10px 25px -5px ${typeColor}33`
                }}>
                    <p className="cognitive-text" style={{ fontSize: '1.1rem', padding: '0 1rem', color: '#e8e8f0' }}>{card.content}</p>
                </div>
            </div>
        </div>
    );
};

const MemoryAssistant = () => {
    const [text, setText] = useState("");
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateCards = async () => {
        if (!text.trim()) return;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            setError("Please add your Gemini API Key in the code (MemoryAssistant.jsx).");
            return;
        }

        setLoading(true);
        setCards([]);
        setError(null);

        try {
            const result = await callGeminiExtractAPI(text);
            setCards(result);
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl mb-2 text-gradient">Memory Assistant</h2>
                    <p className="text-muted text-lg">AI extracts key definitions and points into interactive flashcards.</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="glass-panel mb-8" style={{ maxWidth: '800px', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <label className="font-heading mb-2 text-lg" style={{ fontWeight: 600, display: 'block', color: '#e8e8f0' }}>Study Material</label>
                <textarea
                    className="input-control mb-4"
                    rows="6"
                    placeholder="Paste your notes, articles, or lessons here... We will extract the most important facts for you to remember."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ resize: 'vertical', background: 'rgba(0,0,0,0.2)', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button className="btn btn-primary" onClick={generateCards} disabled={loading || !text.trim()} style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem', opacity: (loading || !text.trim()) ? 0.5 : 1 }}>
                    {loading ? '🧠 Extracting Knowledge...' : '✨ Generate Memory Cards'}
                </button>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center p-8 mt-8">
                    <div className="spinner mb-4" style={{ borderTopColor: '#a78bfa', borderRightColor: 'rgba(167,139,250,0.2)', borderBottomColor: 'rgba(167,139,250,0.2)', borderLeftColor: 'rgba(167,139,250,0.2)' }}></div>
                    <p className="animate-pulse" style={{ color: '#a78bfa', fontWeight: 500 }}>Finding key information...</p>
                </div>
            )}

            {cards.length > 0 && !loading && (
                <div className="animate-fade-in">
                    <h3 className="mb-6 text-2xl" style={{ color: '#e8e8f0' }}>Your Memory Cards</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                        {cards.map((card, idx) => (
                            <div key={card.id} className="animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                <Flashcard card={card} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryAssistant;
