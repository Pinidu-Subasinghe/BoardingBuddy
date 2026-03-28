import React, { useEffect, useMemo, useRef, useState } from 'react';
import { askBrowseChatbot } from '../api/api';

const initialMessage = {
  role: 'assistant',
  text: 'Hi! I am BoardingBuddy Assistant, How can I help you today?'
};

const BrowseChatbotModal = ({
  filters,
  boardings = [],
  open,
  onClose,
  showTrigger = true
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const listRef = useRef(null);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalOpen;

  const toggleOpen = () => {
    if (isControlled) {
      if (isOpen) {
        onClose?.();
      }
      return;
    }
    setInternalOpen((v) => !v);
  };

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
      return;
    }
    setInternalOpen(false);
  };

  const contextBoardings = useMemo(() => {
    return (boardings || []).slice(0, 12).map((b) => ({
      _id: b._id,
      title: b.title,
      city: b.city,
      monthlyRent: b.monthlyRent,
      boardingType: b.boardingType,
      availableCapacity: b.availableCapacity,
      lifestyleTags: b.lifestyleTags || [],
      nearestUniversities: (b.nearestUniversities || []).slice(0, 4),
      safetyBadge: b?._rating?.safetyBadge || ''
    }));
  }, [boardings]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await askBrowseChatbot({
        message: text,
        filters,
        visibleBoardings: contextBoardings
      });

      const reply = res?.data?.reply || 'I could not generate a response right now. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      const msg = err?.message || 'Chatbot is temporarily unavailable. Please try again in a moment.';
      setMessages((prev) => [...prev, { role: 'assistant', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {showTrigger && (
        <>
          <button
            type="button"
            onClick={toggleOpen}
            className="fixed right-4 sm:right-6 bottom-20 z-[70] h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl ring-4 ring-white flex items-center justify-center"
            aria-label="Open browse assistant"
            title="Open BoardingBuddy Assistant"
          >
            {isOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M6 18l-2 2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6z" />
              </svg>
            )}
          </button>

          {!isOpen && (
            <div className="fixed right-20 sm:right-24 bottom-24 z-[70] rounded-full bg-gray-900 text-white text-xs font-medium px-3 py-1 shadow-lg">
              Ask AI
            </div>
          )}
        </>
      )}

      {isOpen && (
        <div className="fixed left-4 right-4 sm:right-6 sm:left-auto bottom-36 sm:w-[420px] z-[70] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">BoardingBuddy Assistant</h4>
                <p className="text-xs text-gray-600 mt-1">Answers are based on current browse listings and filters.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none"
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>
          </div>

          <div ref={listRef} className="h-80 overflow-y-auto px-4 py-3 space-y-3 bg-white">
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[90%] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-600">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              maxLength={300}
              placeholder="Ask about budget, safety, universities, or amenities"
              className="w-full resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{input.length}/300</span>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BrowseChatbotModal;
