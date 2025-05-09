const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Kid-friendly English topics for elementary school children
const kidFriendlyTopics = [
  "alphabet", "phonics", "sight words", "basic spelling", "rhyming words",
  "simple grammar", "basic punctuation", "vocabulary", "reading comprehension", 
  "simple sentences", "storytelling", "adjectives", "nouns", "verbs",
  "grammar", "tenses", "punctuation", "sentence structure", "parts of speech",
  "synonyms", "antonyms", "comprehension", "essay writing", "poetry", "literature"
];

app.get('/api/assignments/mcqs', async (req, res) => {
  let topic = req.query.topic?.toLowerCase() || 'sight words';
  
  // If the exact topic isn't found, try to match to the closest allowed topic
  if (!kidFriendlyTopics.includes(topic)) {
    // Try to find a partial match
    const partialMatch = kidFriendlyTopics.find(t => 
      t.includes(topic) || topic.includes(t)
    );
    
    if (partialMatch) {
      topic = partialMatch;
      console.log(`Mapped input topic to allowed topic: ${topic}`);
    } else {
      return res.status(400).json({ 
        error: `Only kid-friendly English topics are allowed. Allowed topics: ${kidFriendlyTopics.join(', ')}` 
      });
    }
  }

  const prompt = `
You are creating fun, engaging, and educational multiple-choice questions for elementary school children learning English.

Generate 5 kid-friendly MCQs about "${topic}".
- Use colorful, simple language that children would understand
- Include fun examples and engaging scenarios 
- Avoid complex vocabulary unless teaching that specific topic
- Use 3 options for each question
- Use positive reinforcement in the questions

Use this strict JSON format:
{
  "title": "${topic} for Kids",
  "questions": [
    {
      "question": "What letter makes the sound 'sss' like a snake?",
      "options": ["A", "S", "T"],
      "answer": 1,
      "funFact": "Snakes slither and make a 'sss' sound!"
    }
  ]
}
Only return valid JSON. No explanation, no formatting outside JSON.
  `.trim();

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
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
    res.status(500).json({ error: 'Failed to generate kid-friendly MCQs' });
  }
});

// Add a kid-friendly health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: "The learning adventure server is running!" 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌟 Learning adventure started at http://localhost:${PORT}`);
});