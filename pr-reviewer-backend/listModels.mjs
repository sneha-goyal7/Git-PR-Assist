import 'dotenv/config';
const r = await fetch('https://api.groq.com/openai/v1/models', {
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
});
const d = await r.json();
console.log(d.data ? d.data.map(m => m.id).join('\n') : d);