require('dotenv').config();
const GROQ_API_KEY = process.env.VITE_GROQ_VOICE_API || process.env.VITE_GROQ_API_KEY || '';

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

const defaultPrompt = `You are an expert instructor creating a live class presentation.

Class title: "Introduction to Python"
Python is a popular, high-level, interpreted programming language known for its simple and highly readable syntax. Created by Guido van Rossum and released in 1991, it mimics the English language. This design choice allows developers to write clean, understandable code with fewer lines than languages like Java or C++.Key FeaturesEasy to Read - Uses plain English words and relies on clean formatting.Interpreted - Executes code line-by-line, which speeds up testing and prototyping.Dynamically Typed - Automatically determines data types at runtime without explicit declarations.Multi-Paradigm - Supports procedural, object-oriented, and functional programming styles.Cross-Platform - Runs seamlessly across Windows, macOS, Linux, and specialized devices like Raspberry Pi.ApplicationsWeb Development (Django, Flask)Data Science & Machine Learning (Pandas, TensorFlow, Scikit-Learn)Automation & ScriptingGame Development (Pygame)Cybersecurity & NetworkingIts vast ecosystem of libraries and incredibly active community make Python one of the most versatile and beginner-friendly languages in the world today.

CRITICAL: Output EXACTLY 4 sections separated by "---SPLIT---" (use this separator NOWHERE else).

SECTION 1 - PRESENTATION SLIDES (Markdown):
- Generate EXACTLY 12 detailed, high-quality slides covering the topics outlined in the description.
- DO NOT include any images, photos, or ![] markdown whatsoever.
- Each slide MUST be separated by exactly "---" on its own line.
- Slide 1: Title slide with # Title and a descriptive tagline.
- Slides 2-11: Deep dive into the subject matter. Use # for slide title, followed by 4-6 bullet points. Each bullet point should be insightful and informative (not just a few words).
- Slide 12: Summary and Key Takeaways.

---SPLIT---

SECTION 2 - TEACHER KEYPOINTS:
For each slide, provide exactly 3 teaching notes (teaching point, analogy, gotcha):
[Slide 1]
- Point: ...
- Analogy: ...
- Gotcha: ...
(continue for all 12 slides)

---SPLIT---

SECTION 3 - TELEPROMPTER SCRIPT:
Write a comprehensive, engaging teleprompter script for the instructor. It should start with a warm welcome (e.g., "Welcome everyone to today's masterclass on..."), introduce the core concepts, provide a high-level overview of what will be taught, and include some motivational words. The script must be at least 3 well-written paragraphs to ensure the instructor has a solid opening monologue before diving into the slides.

---SPLIT---

SECTION 4 - STUDENT STUDY GUIDE (Markdown):
Write a comprehensive, detailed study guide formatted in Markdown designed specifically for the student. It should explain the core concepts of the class in an easy-to-understand way, include practical examples, and provide step-by-step code snippets (if applicable). This guide will be shown directly to the student for self-study.`;

async function test() {
  try {
    console.log("Calling Groq...");
    const content = await callGroq(defaultPrompt);
    const parts = content.split('---SPLIT---');
    console.log("Returned parts:", parts.length);
    if (parts.length < 4) {
      console.log("CONTENT WAS:");
      console.log(content);
    } else {
      console.log("Success! Parts sizes:", parts.map(p => p.length));
    }
  } catch(e) {
    console.error(e);
  }
}
test();
