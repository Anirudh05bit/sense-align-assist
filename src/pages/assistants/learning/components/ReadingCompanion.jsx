import React, { useState, useRef } from 'react';

// Hardcode or use environment variable for Gemini API Key here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDdKq8tNRtGjf34PZKvT96CGCfGwbsmKYw";

const callGeminiExplainAPI = async (text) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    const prompt = `Explain the following text simply and clearly in 2-3 sentences max. Assume the reader struggles with cognitive overload and complex terminology. Text: "${text}"`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } })
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Explanation failed.";
};

const callGeminiChatAPI = async (question, documentText, history) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // Construct context
    let formattedHistory = history.map(m => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.content}`).join('\n');
    const prompt = `You are a helpful reading companion for someone who needs simple, clear answers. 
Answer the user's question based strictly on the provided document. Keep your answer brief, warm, and highly readable.

Document:
"""
${documentText}
"""

Conversation History:
${formattedHistory}

User's new question: ${question}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } })
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Answer failed.";
};

const ReadingCompanion = () => {
    // We start in 'editing' mode if there's no document inserted.
    const [documentText, setDocumentText] = useState("");
    const [isEditing, setIsEditing] = useState(true);

    const [selectedText, setSelectedText] = useState("");
    const [explanation, setExplanation] = useState("");
    const [loadingExp, setLoadingExp] = useState(false);

    const [messages, setMessages] = useState([{ role: 'ai', content: 'Hi! I am your AI Reading Companion. Highlight any text on the left to get an instant explanation, or ask me a question about the document.' }]);
    const [chatInput, setChatInput] = useState("");
    const [loadingChat, setLoadingChat] = useState(false);
    const [errorExp, setErrorExp] = useState(null);

    const textRef = useRef(null);

    const startReading = () => {
        if (!documentText.trim()) return;
        setIsEditing(false);
        // Reset chat and explanations when changing document
        setMessages([{ role: 'ai', content: 'Hi! I am your AI Reading Companion. Highlight any text on the left to get an instant explanation, or ask me a question about the document.' }]);
        setExplanation("");
        setSelectedText("");
    };

    const handleTextSelection = async () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text && text.length > 3) {
            setSelectedText(text);

            if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
                setExplanation("Please add your Gemini API Key in the code (ReadingCompanion.jsx).");
                return;
            }

            setLoadingExp(true);
            setExplanation("");
            setErrorExp(null);

            try {
                const result = await callGeminiExplainAPI(text);
                setExplanation(result);
            } catch (err) {
                setExplanation("Error: " + err.message);
            } finally {
                setLoadingExp(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            setMessages(prev => [...prev, { role: 'user', content: chatInput }, { role: 'ai', content: 'Please add your Gemini API Key in the code (ReadingCompanion.jsx) to chat!' }]);
            setChatInput("");
            return;
        }

        const userMsg = chatInput;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput("");
        setLoadingChat(true);

        try {
            const response = await callGeminiChatAPI(userMsg, documentText, messages);
            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I hit an error connecting to the AI: ' + err.message }]);
        } finally {
            setLoadingChat(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column' }}>
            <header className="mb-6 flex-shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl mb-2 text-gradient">AI Reading Companion</h2>
                    <p className="text-muted text-lg">Read documents with a helpful AI by your side to explain complex terms.</p>
                </div>
            </header>

            {isEditing ? (
                // EDIT MODE
                <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)', maxWidth: '800px' }}>
                    <label className="font-heading mb-2 text-lg" style={{ fontWeight: 600, color: '#e8e8f0' }}>Paste the Document to Read</label>
                    <textarea
                        className="input-control mb-4"
                        placeholder="Paste any article, long email, or document here to start reading with AI..."
                        value={documentText}
                        onChange={(e) => setDocumentText(e.target.value)}
                        style={{
                            flexGrow: 1,
                            minHeight: '300px',
                            resize: 'vertical',
                            background: 'rgba(0,0,0,0.2)',
                            color: '#e8e8f0',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '1.1rem',
                            padding: '1rem'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={startReading}
                        disabled={!documentText.trim()}
                        style={{ alignSelf: 'flex-start', fontSize: '1.1rem', padding: '0.75rem 2rem', opacity: !documentText.trim() ? 0.5 : 1 }}
                    >
                        📖 Open in Reading Companion
                    </button>
                </div>
            ) : (
                // READING MODE
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', flexGrow: 1, minHeight: 0 }}>

                    {/* Left: Document View */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-heading text-xl" style={{ color: '#e8e8f0' }}>Document Reader</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#e8e8f0' }}>Highlight text to explain</span>
                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#e8e8f0', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => setIsEditing(true)}>Edit Input</button>
                            </div>
                        </div>
                        <div
                            ref={textRef}
                            onMouseUp={handleTextSelection}
                            onKeyUp={handleTextSelection}
                            className="cognitive-text"
                            style={{
                                flexGrow: 1,
                                overflowY: 'auto',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                whiteSpace: 'pre-wrap',
                                fontSize: '1.2rem',
                                lineHeight: 1.8,
                                color: '#e8e8f0'
                            }}
                        >
                            {documentText}
                        </div>
                    </div>

                    {/* Right: AI Companion Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>

                        {/* Explanation Tooltip Area */}
                        <div className="glass-panel text-sm" style={{ padding: '1.25rem', borderLeft: '4px solid #a78bfa', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h4 className="mb-2 flex items-center gap-2" style={{ color: '#c4b5fd' }}>
                                <span>🔍</span> Instant Explanation
                            </h4>
                            {!selectedText && !loadingExp && <p className="text-muted italic">Highlight text in the document...</p>}

                            {loadingExp && (
                                <div className="flex items-center gap-2">
                                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#a78bfa', borderRightColor: 'rgba(167,139,250,0.2)', borderBottomColor: 'rgba(167,139,250,0.2)', borderLeftColor: 'rgba(167,139,250,0.2)' }}></div>
                                    <span style={{ color: '#a78bfa' }}>Explaining...</span>
                                </div>
                            )}

                            {explanation && !loadingExp && (
                                <div className="animate-fade-in">
                                    <div className="mb-2" style={{ padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontStyle: 'italic', display: 'inline-block', color: 'rgba(232,232,240,0.6)' }}>
                                        "{selectedText.length > 40 ? selectedText.substring(0, 40) + '...' : selectedText}"
                                    </div>
                                    <p style={{ color: '#e8e8f0', fontSize: '0.95rem' }}>{explanation}</p>
                                </div>
                            )}
                        </div>

                        {/* Chat Interface */}
                        <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflow: 'hidden', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h4 className="mb-4 flex items-center gap-2" style={{ color: '#e8e8f0' }}>
                                <span>💬</span> Document Q&A
                            </h4>

                            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                                {messages.map((msg, i) => (
                                    <div key={i} style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        background: msg.role === 'user' ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.05)',
                                        color: msg.role === 'user' ? '#fff' : '#e8e8f0',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        borderBottomRightRadius: msg.role === 'user' ? 0 : 'var(--radius-lg)',
                                        borderBottomLeftRadius: msg.role === 'ai' ? 0 : 'var(--radius-lg)',
                                        maxWidth: '85%',
                                        fontSize: '0.95rem',
                                        border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                    }}>
                                        {msg.content}
                                    </div>
                                ))}
                                {loadingChat && (
                                    <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)' }}>
                                        <span className="animate-pulse" style={{ color: '#e8e8f0' }}>Thinking...</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2" style={{ marginTop: 'auto' }}>
                                <input
                                    type="text"
                                    className="input-control"
                                    placeholder="Ask a question..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || loadingChat}
                                    style={{ padding: '0.5rem 1rem', opacity: (!chatInput.trim() || loadingChat) ? 0.6 : 1 }}
                                >
                                    Send
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingCompanion;
