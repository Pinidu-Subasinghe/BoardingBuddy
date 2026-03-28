const { GoogleGenAI } = require('@google/genai');
const Boarding = require('../models/Boarding');

const FAST_CONTEXT_LIMIT = 12;
const CACHE_TTL_MS = 45 * 1000;
const MODEL_TIMEOUT_MS = 9000;
const responseCache = new Map();

const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('MODEL_TIMEOUT'));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const pickBoardingContext = (list) => {
  return list.slice(0, FAST_CONTEXT_LIMIT).map((b) => ({
    id: String(b._id || b.id || ''),
    title: b.title || '',
    city: b.city || '',
    rent: Number(b.monthlyRent || 0),
    type: b.boardingType || '',
    cap: Number(b.availableCapacity || 0),
    tags: Array.isArray(b.lifestyleTags) ? b.lifestyleTags.slice(0, 6) : [],
    uni: Array.isArray(b.nearestUniversities) ? b.nearestUniversities.slice(0, 4) : [],
    safety: b.safetyBadge || ''
  }));
};

const buildCacheKey = ({ message, filters, boardings }) => {
  const shortlist = (boardings || []).slice(0, FAST_CONTEXT_LIMIT).map((b) => b.id || b.title || '');
  return `${message.toLowerCase()}|${JSON.stringify(filters || {})}|${JSON.stringify(shortlist)}`;
};

const askBrowseChatbot = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Gemini API key is missing on server' });
    }

    const message = String(req.body?.message || '').trim();
    const filters = req.body?.filters || {};
    const visibleBoardings = Array.isArray(req.body?.visibleBoardings)
      ? req.body.visibleBoardings
      : [];

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (message.length > 300) {
      return res.status(400).json({ message: 'Message must be 300 characters or fewer' });
    }

    const rawBoardings = visibleBoardings.length > 0
      ? visibleBoardings
      : await Boarding.find({ status: 'approved' })
          .select('title city monthlyRent boardingType availableCapacity lifestyleTags nearestUniversities')
          .limit(FAST_CONTEXT_LIMIT)
          .lean();

    const boardings = pickBoardingContext(rawBoardings);

    const cacheKey = buildCacheKey({ message, filters, boardings });
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json({ reply: cached.reply, cached: true });
    }

    const context = {
      filters,
      boardings
    };

    const prompt = [
      'You are the BoardingBuddy browse assistant.',
      'Rules:',
      '- Answer only about finding boardings on this platform.',
      '- Use the provided context only; if data is missing, say it clearly.',
      '- Keep responses concise, practical, and student-friendly (max 90 words).',
      '- Suggest filter changes when useful.',
      '',
      'Context JSON:',
      JSON.stringify(context),
      '',
      `User question: ${message}`
    ].join('\n');

    const client = new GoogleGenAI({ apiKey });
    const result = await withTimeout(
      client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      }),
      MODEL_TIMEOUT_MS
    );

    const reply = String(result?.text || '').trim() || 'I could not generate a response right now.';
    responseCache.set(cacheKey, { reply, ts: Date.now() });

    return res.json({ reply });
  } catch (error) {
    if (error.message === 'MODEL_TIMEOUT') {
      return res.json({
        reply: 'Response took too long. Try a shorter question like "best options under Rs.15000 near my university".'
      });
    }
    console.error('askBrowseChatbot error:', error);
    return res.status(500).json({ message: 'Chatbot error. Please try again.' });
  }
};

module.exports = { askBrowseChatbot };
