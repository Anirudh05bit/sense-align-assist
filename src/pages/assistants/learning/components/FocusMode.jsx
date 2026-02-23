import React, { useState } from 'react';

// Hardcode or use environment variable for Gemini API Key here
// Note: Ensure your API key is active and has "Generative Language API" enabled in Google Cloud Console
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAQ5pf0l6-hVpSrkDq6PC8StoAk7on2Gtk";

const callGeminiFocusAPI = async (text, fileBase64) => {
    // FIXED: Changed model name from gemini-2.5-flash to gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `You are a reading assistant for someone who gets easily overwhelmed by long paragraphs. Take the following text (and/or attached PDF) and split it into completely separate, logical, easy-to-read sentences. 
    
IMPORTANT: You MUST respond ONLY with a valid JSON array. Output the raw JSON string without markdown blocks.

The JSON MUST be a simple array of strings:
[
  "The first short, readable sentence.",
  "The second short, readable sentence.",
  "The third short, readable sentence."
]

Original Text:
"""
${text || "[See attached PDF document]"}
"""`;

    const parts = [{ text: prompt }];

    if (fileBase64) {
        const base64Data = fileBase64.split(',')[1];
        if (base64Data) {
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            });
        }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts }], 
            generationConfig: { 
                temperature: 0.1,
                // Added response_mime_type to help force JSON formatting
                response_mime_type: "application/json" 
            } 
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        // Provides more specific error feedback
        throw new Error(errorBody.error?.message || "API failed to connect.");
    }
    
    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("AI returned an empty response.");

    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(resultText);
    } catch (e) {
        throw new Error("AI did not return valid JSON format. Try again.");
    }
};

const FocusMode = () => {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [fileBase64, setFileBase64] = useState(null);
    const [sentences, setSentences] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReading, setIsReading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) {
            setFile(null);
            setFileBase64(null);
            return;
        }

        if (selectedFile.type !== 'application/pdf') {
            setError("Only PDF files are supported.");
            setFile(null);
            setFileBase64(null);
            return;
        }

        setError(null);
        setFile(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => {
            setFileBase64(reader.result);
        };
        reader.onerror = () => {
            setError("Failed to read the PDF file.");
            setFile(null);
            setFileBase64(null);
        };
    };

    const startReading = async () => {
        if (!text.trim() && !fileBase64) {
            setError("Please provide either some text or a PDF document.");
            return;
        }
        if (!API_KEY || API_KEY.startsWith("YOUR_API_KEY")) {
            setError("Please add a valid Gemini API Key.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const splitSentences = await callGeminiFocusAPI(text, fileBase64);
            if (!Array.isArray(splitSentences) || splitSentences.length === 0) {
                throw new Error("Invalid format returned by AI.");
            }
            setSentences(splitSentences);
            setCurrentIndex(0);
            setIsReading(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred while preparing Focus Mode.");
        } finally {
            setLoading(false);
        }
    };

    const nextSentence = () => {
        if (currentIndex < sentences.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevSentence = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleKeyDown = (e) => {
        if (isReading) {
            if (e.key === 'ArrowRight') nextSentence();
            if (e.key === 'ArrowLeft') prevSentence();
            if (e.key === 'Escape') setIsReading(false);
        }
    };

    React.useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReading, currentIndex, sentences.length]);

    if (isReading) {
        return (
            <div className="animate-fade-in" style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => setIsReading(false)}
                    style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(255,255,255,0.05)', color: '#e8e8f0', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    ✕ Exit Focus Mode
                </button>

                <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                    <div className="text-muted mb-4" style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>
                        Sentence {currentIndex + 1} of {sentences.length}
                    </div>

                    <div className="glass-panel mb-8" style={{ padding: '4rem 2rem', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(167,139,250,0.3)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)' }}>
                        <p className="cognitive-text animate-fade-in" key={currentIndex} style={{ fontSize: '2rem', fontWeight: 500, lineHeight: 1.6, color: '#e8e8f0' }}>
                            {sentences[currentIndex]}
                        </p>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button className="btn btn-secondary" onClick={prevSentence} disabled={currentIndex === 0} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)', color: '#e8e8f0', borderColor: 'rgba(255,255,255,0.1)' }}>
                            ← Previous
                        </button>
                        <button className="btn btn-primary" onClick={nextSentence} disabled={currentIndex === sentences.length - 1} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                            Next →
                        </button>
                    </div>
                    <div className="text-muted mt-4 text-sm">You can also use arrow keys to navigate. Press ESC to exit.</div>

                    <div className="mt-8 flex justify-center gap-2 flex-wrap" style={{ maxWidth: '400px', margin: '2rem auto 0' }}>
                        {sentences.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: idx === currentIndex ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                                    transition: 'background var(--transition-fast), transform var(--transition-fast)',
                                    cursor: 'pointer', transform: idx === currentIndex ? 'scale(1.5)' : 'scale(1)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl mb-2 text-gradient">Focus Mode</h2>
                    <p className="text-muted text-lg">AI intelligently splits complex text or PDFs into readable chunks to reduce overwhelm.</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="glass-panel" style={{ maxWidth: '800px', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <label className="font-heading mb-4 text-lg" style={{ fontWeight: 600, display: 'block', color: '#e8e8f0' }}>Text to Read</label>

                <div className="mb-4">
                    <label className="text-sm mb-2 block" style={{ color: 'rgba(232,232,240,0.7)' }}>Upload PDF Document</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="input-control"
                        style={{
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            width: '100%',
                            background: 'rgba(0,0,0,0.2)',
                            color: '#e8e8f0',
                            border: '1px dashed rgba(167,139,250,0.4)',
                            cursor: 'pointer'
                        }}
                    />
                    {file && (
                        <div className="text-sm mt-2 flex items-center gap-2" style={{ color: '#10B981' }}>
                            <span>📄</span> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div style={{ flexGrow: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'rgba(232,232,240,0.5)' }}>AND / OR PASTE TEXT</span>
                    <div style={{ flexGrow: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <textarea
                    className="input-control mb-6"
                    rows="8"
                    placeholder="Paste the text you want to read here... (Focus Mode will format it for you)"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ resize: 'vertical', background: 'rgba(0,0,0,0.2)', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button className="btn btn-primary" onClick={startReading} disabled={loading || (!text.trim() && !fileBase64)} style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', opacity: (loading || (!text.trim() && !fileBase64)) ? 0.5 : 1 }}>
                    {loading ? '⚙️ AI Formatting Text...' : '📖 Start Reading Focus Mode'}
                </button>
            </div>
        </div>
    );
};

export default FocusMode;