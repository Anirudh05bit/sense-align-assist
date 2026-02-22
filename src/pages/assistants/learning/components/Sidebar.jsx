import React, { useMemo, useState } from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'simplifier', label: 'Smart Simplifier', icon: '✨' },
        { id: 'focus', label: 'Focus Mode', icon: '📖' },
        { id: 'memory', label: 'Memory Assistant', icon: '🧠' },
        { id: 'tasks', label: 'Task Breakdown', icon: '✅' },
        { id: 'companion', label: 'Reading Companion', icon: '🤖' },
    ];

    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return navItems;
        return navItems.filter(
            (i) => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
        );
    }, [query]);

    const choose = (id) => {
        setActiveTab(id);
        setQuery('');
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered && filtered.length) choose(filtered[0].id);
        }
    };

    return (
        <aside className="sidebar simple-sidebar animate-fade-in">
            <div className="sidebar-input-wrap">
                <input
                    aria-label="Search features"
                    className="sidebar-search"
                    placeholder="Search features or type a command..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                />
            </div>

            <div className="sidebar-suggestions">
                {filtered.map((item) => (
                    <button
                        key={item.id}
                        className={`suggestion ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => choose(item.id)}
                    >
                        <span className="suggestion-icon">{item.icon}</span>
                        <span className="suggestion-label">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-sm text-muted text-center">
                Cognitive Assistant
            </div>
        </aside>
    );
};

export default Sidebar;
