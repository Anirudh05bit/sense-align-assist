import { useState } from "react";
import { MessageCircle, Heart, Send, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const supportMessages = [
  { role: "ai", text: "Hello! I'm your ADAPT-AI support companion. I've reviewed your assessment results and I'm here to help you understand them in a supportive way. 💙", time: "Just now" },
  { role: "ai", text: "First, I want you to know — your results show many areas of strength. Let's focus on those while also identifying where adaptive tools can make your experience even better.", time: "Just now" },
  { role: "ai", text: "Your visual processing scores are strong, especially in color differentiation (85%). Some areas like scene description could benefit from assistive tools, and that's perfectly okay.", time: "Just now" },
];

const assistanceCards = [
  { title: "Visual Assistance", desc: "Screen readers, magnification, and high-contrast modes tailored to your profile", icon: "👁️" },
  { title: "Audio Support", desc: "Speech-to-text, audio amplification, and captioning tools", icon: "👂" },
  { title: "Learning Aids", desc: "Simplified content, step-by-step guides, and memory reinforcement", icon: "🧠" },
];

const AISupport = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(supportMessages);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input, time: "Just now" }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Thank you for sharing that. I understand your concerns, and I'm here to support you every step of the way. Let's work together to find the best adaptive solutions for you. 💙",
          time: "Just now",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-clinical-teal-light flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AI Support & Guidance</h1>
          <p className="text-sm text-muted-foreground">Your personal companion for understanding results</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 clinical-card flex flex-col" style={{ height: "600px" }}>
          <div className="p-4 border-b border-border flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">ADAPT-AI Companion</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="status-dot status-complete" /> Online
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {msg.text}
                  <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={sendMessage} size="sm" className="px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="clinical-card p-5 clinical-gradient-light">
            <Shield className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">Your Privacy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All conversations are confidential and encrypted. Your data is never shared without consent.
            </p>
          </div>

          <h3 className="font-display font-semibold text-foreground text-sm">Personalized Assistance</h3>
          {assistanceCards.map((card) => (
            <div key={card.title} className="clinical-card p-4">
              <span className="text-2xl mb-2 block">{card.icon}</span>
              <h4 className="font-display font-semibold text-sm text-foreground">{card.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AISupport;
