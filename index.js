const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Allowed topics strictly within English subject
const allowedEnglishTopics = [
  "grammar", "tenses", "punctuation", "sentence structure", "parts of speech",
  "synonyms", "antonyms", "comprehension", "essay writing", "poetry", "literature"
];

app.get('/api/assignments/mcqs', async (req, res) => {
  const topic = req.query.topic?.toLowerCase() || 'grammar';

  if (!allowedEnglishTopics.includes(topic)) {
    return res.status(400).json({ error: `Only English language topics are allowed. Allowed topics: ${allowedEnglishTopics.join(', ')}` });
  }

  const prompt = `
You are an AI tutor creating MCQs only for the English language subject.

Generate 5 multiple choice questions for the topic "${topic}". 
Use this strict JSON format:
{
  "title": "${topic}",
  "questions": [
    {
      "question": "Sample question?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": 2
    }
  ]
}
Only return valid JSON in English. No explanation, no formatting outside JSON.
  `.trim();

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const rawText = response.data.choices[0].message.content;
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}') + 1;
    const cleanJson = rawText.slice(jsonStart, jsonEnd);

    const mcqs = JSON.parse(cleanJson);
    res.json(mcqs);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate MCQs' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
