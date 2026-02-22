import React, { useState } from 'react';

// Hardcode or use environment variable for Gemini API Key here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDdKq8tNRtGjf34PZKvT96CGCfGwbsmKYw";

const callGeminiDecomposeAPI = async (goal) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `You are an ADHD / cognitive accessibility executive function coach. A user is overwhelmed by a large goal. Break this goal down into exact, small, manageable steps.

IMPORTANT: You MUST respond ONLY with a valid JSON format. Output the raw JSON string without markdown blocks.

The JSON MUST have this exact structure:
{
  "goal": "The simplified goal",
  "steps": [
    { "id": 1, "text": "Specific micro-step", "time": "e.g., 5 mins", "priority": "High/Medium/Low", "done": false }
  ]
}

Make sure time estimates are realistic but encouraging (prefer 'mins' over hours if possible). Keep it to 5-8 steps.

User's goal:
"""
${goal}
"""`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to connect to AI API.");
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("AI returned empty response.");

    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(resultText);
        parsed.steps = parsed.steps.map((s, idx) => ({ ...s, id: Date.now() + idx, done: false }));
        return parsed;
    } catch (e) {
        throw new Error("AI did not return valid JSON. Try again.");
    }
};

const TaskDecomposer = () => {
    const [goal, setGoal] = useState("");
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generatePlan = async () => {
        if (!goal.trim()) return;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            setError("Please add your Gemini API Key in the code (TaskDecomposer.jsx).");
            return;
        }

        setLoading(true);
        setPlan(null);
        setError(null);

        try {
            const result = await callGeminiDecomposeAPI(goal);
            setPlan(result);
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStep = (id) => {
        if (!plan) return;
        const newSteps = plan.steps.map(step =>
            step.id === id ? { ...step, done: !step.done } : step
        );
        setPlan({ ...plan, steps: newSteps });
    };

    const completedCount = plan ? plan.steps.filter(s => s.done).length : 0;
    const progress = plan ? (completedCount / plan.steps.length) * 100 : 0;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl mb-2 text-gradient">Task Breakdown Assistant</h2>
                    <p className="text-muted text-lg">AI acts as your executive function coach to break down big goals.</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Left Column: Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <label className="font-heading mb-2 text-lg" style={{ fontWeight: 600, display: 'block', color: '#e8e8f0' }}>Your Goal</label>
                        <input
                            type="text"
                            className="input-control mb-4"
                            placeholder='e.g., "Finish my history essay" or "Clean the house"'
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && generatePlan()}
                            style={{ fontSize: '1.1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button className="btn btn-primary" onClick={generatePlan} disabled={loading || !goal.trim()} style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem', width: '100%', opacity: (loading || !goal.trim()) ? 0.5 : 1 }}>
                            {loading ? '⚙️ Breaking down task...' : '🎯 Create Action Plan'}
                        </button>
                    </div>

                    {loading && (
                        <div className="glass-panel mt-4 flex flex-col items-center justify-center" style={{ minHeight: '200px', background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="spinner mb-4" style={{ borderTopColor: '#a78bfa', borderRightColor: 'rgba(167,139,250,0.2)', borderBottomColor: 'rgba(167,139,250,0.2)', borderLeftColor: 'rgba(167,139,250,0.2)' }}></div>
                            <p className="animate-pulse" style={{ color: '#a78bfa' }}>Analyzing goal and estimating time...</p>
                        </div>
                    )}

                    {plan && !loading && (
                        <div className="glass-panel animate-fade-in" style={{ background: 'rgba(20,25,40,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h3 className="mb-4" style={{ color: '#e8e8f0' }}>Progress Tracker</h3>
                            <div style={{ background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{
                                    background: 'linear-gradient(90deg, #a78bfa, #10B981)',
                                    height: '100%',
                                    width: `${progress}%`,
                                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}></div>
                            </div>
                            <div className="flex justify-between text-sm font-heading" style={{ fontWeight: 600, color: '#e8e8f0' }}>
                                <span style={{ color: progress === 100 ? '#10B981' : '#a78bfa' }}>
                                    {progress === 100 ? '🎉 Goal Complete!' : `${completedCount} of ${plan.steps.length} steps done`}
                                </span>
                                <span className="text-muted">{Math.round(progress)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Results */}
                <div>
                    {!plan && !loading && (
                        <div className="flex flex-col items-center justify-center text-muted glass-panel" style={{ height: '100%', minHeight: '300px', border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                            <span style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📝</span>
                            <p>Your step-by-step action plan will appear here.</p>
                        </div>
                    )}

                    {plan && !loading && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {plan.steps.map((step) => (
                                <div
                                    key={step.id}
                                    className="glass-panel"
                                    onClick={() => toggleStep(step.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                                        cursor: 'pointer', opacity: step.done ? 0.6 : 1,
                                        transform: step.done ? 'scale(0.98)' : 'scale(1)',
                                        borderLeft: `4px solid ${step.done ? '#10B981' : step.priority === 'High' ? '#ef4444' : '#f59e0b'}`,
                                        background: 'rgba(20,25,40,0.5)',
                                        transition: 'all var(--transition-normal)'
                                    }}
                                >
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: `2px solid ${step.done ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                                        background: step.done ? '#10B981' : 'rgba(0,0,0,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', flexShrink: 0
                                    }}>
                                        {step.done && '✓'}
                                    </div>

                                    <div style={{ flexGrow: 1 }}>
                                        <h4 style={{
                                            fontSize: '1.1rem', marginBottom: '0.25rem',
                                            textDecoration: step.done ? 'line-through' : 'none',
                                            color: step.done ? 'var(--color-text-muted)' : '#e8e8f0'
                                        }}>
                                            {step.text}
                                        </h4>
                                        <div className="flex gap-4 text-sm text-muted">
                                            <span className="flex items-center gap-1">⏱️ {step.time}</span>
                                            <span className="flex items-center gap-1">
                                                <span style={{ color: step.priority === 'High' ? '#ef4444' : '#f59e0b' }}>■</span>
                                                {step.priority} Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDecomposer;
