import { useState } from 'react';
import SmartSimplifier from './components/SmartSimplifier';
import FocusMode from './components/FocusMode';
import MemoryAssistant from './components/MemoryAssistant';
import TaskDecomposer from './components/TaskDecomposer';
import ReadingCompanion from './components/ReadingCompanion';
import "./components/index.css";
const LearningAssistant = () => {
const [activeTab, setActiveTab] = useState('dashboard');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (typeof window !== 'undefined') {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
  }

  const NAV_ITEMS = [
    { id: 'simplifier', label: 'Smart Simplifier', icon: '' },
    { id: 'focus', label: 'Focus Mode', icon: '' },
    { id: 'memory', label: 'Memory Assistant', icon: '' },
    { id: 'tasks', label: 'Task Breakdown', icon: '' },
    { id: 'companion', label: 'Reading Companion', icon: '' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'simplifier':
        return <SmartSimplifier />;
      case 'focus':
        return <FocusMode />;
      case 'memory':
        return <MemoryAssistant />;
      case 'tasks':
        return <TaskDecomposer />;
      case 'companion':
        return <ReadingCompanion />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="stars-bg">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      <div className="app-layout">
        {/* Navigation Bar */}
        <nav className={`nav-wrap${scrolled ? ' scrolled' : ''}`}>
          <div className="nav-pill">
            <div className="nav-logo" onClick={() => setActiveTab('dashboard')}>
              Cognify
            </div>

            <div className="nav-links-desktop">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`nav-link${activeTab === item.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <button
              className={`nav-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="nav-mobile-menu">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-mobile-link${activeTab === item.id ? ' active' : ''}`}
                onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}

        <main className="main-content">
          {activeTab === 'dashboard' ? (
            <>
              <div className="demo-hero">
                <p className="demo-eyebrow">AI Cognitive Suite</p>
                <h1 className="demo-title">Think clearer, work smarter.</h1>
                <p className="demo-sub">
                  Pick a tool from the nav above to reduce mental overload with smart AI-powered assistance.
                </p>
              </div>
            </>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </>
  );
};

export default LearningAssistant;