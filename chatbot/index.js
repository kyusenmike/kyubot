// This code runs the chatbot. No changes needed!
const express = require('express');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Load knowledge base
const knowledgeBase = JSON.parse(fs.readFileSync('knowledge_base.json'));

function getKnowledgeResponse(userMessage) {
    const message = userMessage.toLowerCase();
    for (const intent of knowledgeBase.intents) {
        for (const pattern of intent.patterns) {
            if (message.includes(pattern.toLowerCase())) {
                return intent.responses[0];
            }
        }
    }
    return null;
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const kbResponse = getKnowledgeResponse(message);
    if (kbResponse) {
        return res.json({ reply: kbResponse });
    }

    try {
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-1.3b",
                messages: [
                    { role: "system", content: "Answer ONLY using the provided knowledge base. If unsure, say 'I don't know.'" },
                    { role: "user", content: message }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "I'm unable to assist at the moment." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
