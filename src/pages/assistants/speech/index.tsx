import React, { useState } from 'react';
// Path adjusted for src/pages/assistants/speech/ layout
import AccessibilityModal from '../../../components/AccessibilityModal';

const SpeechAssistant = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-outfit text-slate-800">
        Speech & Hearing Assistant
      </h1>
      <p className="mt-4 text-slate-600 max-w-2xl">
        AI assistant customized for hearing & speech challenges. 
        This tool includes live transcription, text-to-speech, and sign language translation.
      </p>

      {/* Button to launch the Assistant Modal */}
      <div className="mt-8">
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-indigo-500/20"
        >
          Launch Assistant
        </button>
      </div>

      {/* Integrated Assistant Modal */}
      <AccessibilityModal 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
    </div>
  );
};

export default SpeechAssistant;