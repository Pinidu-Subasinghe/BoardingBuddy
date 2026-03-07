import React from 'react';
import faqData from '../data/faq.json';

const FAQ = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-8 text-indigo-700">Frequently Asked Questions</h1>
    <div className="space-y-6">
      {faqData.map((item, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-indigo-700 mb-2">Q: {item.question}</h2>
          <p className="text-gray-700">A: {item.answer}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FAQ;
