const GROQ_API_KEY = import.meta.env.VITE_GROQ_VOICE_API || import.meta.env.VITE_GROQ_API_KEY || '';

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_VOICE_API is not set in .env');

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
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No content returned from AI');
  }
  return data.choices[0].message.content;
}

/**
 * Generates three items for a live class:
 *  1. Markdown slides (for presentation view)
 *  2. Bullet-point keypoints for teacher reference (mapped per slide)
 *  3. Teleprompter script (We are removing this from the UI, but keeping in API if needed)
 */
export async function generateAIMaterials(
  title: string,
  description: string = ''
): Promise<{ ppt: string; keypoints: string; script: string; studyGuide: string }> {
  // Read teacher's custom system prompt from settings (falls back to default)
  const SLIDE_PROMPT_KEY = 'cynexai_slide_system_prompt';
  const defaultPrompt = `You are an expert instructor creating a live class presentation.

Class title: "{{title}}"
{{description}}

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

  const templatePrompt = localStorage.getItem(SLIDE_PROMPT_KEY) || defaultPrompt;

  // Replace {{title}} and {{description}} placeholders
  const prompt = templatePrompt
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{description\}\}/g, description ? `Additional context: ${description}` : '');

  try {
    const content = await callGroq(prompt);
    const parts = content.split('---SPLIT---');

    if (parts.length >= 4) {
      return {
        ppt: parts[0].trim(),
        keypoints: parts[1].trim(),
        script: parts[2].trim(),
        studyGuide: parts[3].trim(),
      };
    }

    throw new Error('AI did not return 4 parts');
  } catch (error: any) {
    console.error('AI Material generation failed:', error);
    // Show a user-friendly message for quota errors
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
}

/**
 * Generates a post-class AI summary for students
 */
export async function generatePostClassSummary(
  title: string,
  keypoints: string
): Promise<string> {
  const prompt = `You are a helpful teaching assistant for CynexAI EdTech platform.

The class "${title}" just finished. Here are the keypoints that were covered:
${keypoints}

Generate a well-formatted Markdown summary document for the students to review. Include:
1. ## What We Learned (bullet list of key concepts)
2. ## Important Concepts (with brief explanations)
3. ## Real-World Applications (2-3 examples)
4. ## Practice Suggestions (2-3 actionable exercises)

Keep it concise but thorough. Use **bold** for key terms. Use inline code for any code/syntax.`;

  try {
    return await callGroq(prompt);
  } catch (error: any) {
    console.error('Post-class summary generation failed:', error);
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    return `## What We Learned\n\n- Core concepts of **${title}**\n- Practical applications in real-world scenarios\n- Key syntax and usage patterns\n\n## Practice Suggestions\n\n1. Build a small project using today's concepts\n2. Review the code examples from the session\n3. Try the coding challenge in the LMS`;
  }
}

/**
 * Generates MCQ + coding Q&A questions for a class lesson.
 * Returns array of { type, question_text, options, correct_answer_idx, boilerplate, test_cases }
 */
export async function generateAIQuestions(title: string, description: string, keypoints: string, hasCoding: boolean = true): Promise<Array<{
  type: 'mcq' | 'coding';
  question_text: string;
  options?: string[];
  correct_answer_idx?: number;
  boilerplate?: string;
  test_cases?: string;
}>> {
  const codingExample = hasCoding ? `,
  {
    "type": "coding",
    "question_text": "Write a Python function to ... [describe a task related to ${title}]",
    "boilerplate": "def solution():\\n    # Write your code here\\n    pass",
    "test_cases": "[{\\"input\\": \\"()\\", \\"expected\\": \\"result\\"}]"
  },
  {
    "type": "coding",
    "question_text": "Write a Python function to ... [describe another task related to ${title}]",
    "boilerplate": "def solution():\\n    # Write your code here\\n    pass",
    "test_cases": "[{\\"input\\": \\"1, 2\\", \\"expected\\": \\"3\\"}]"
  }` : '';

  const prompt = `You are a coding instructor for CynexAI. Generate quiz questions for the class: "${title}".

Output EXACTLY this JSON array (no markdown fences, no explanation, just raw JSON):
[
  {
    "type": "mcq",
    "question_text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_idx": 0
  },
  {
    "type": "mcq",
    "question_text": "Another MCQ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_idx": 2
  },
  {
    "type": "mcq",
    "question_text": "Third MCQ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_idx": 1
  }${codingExample}
]

Generate exactly 4 MCQ questions${hasCoding ? ' and exactly 2 coding questions' : ''} specifically testing the knowledge from this class:
TITLE: ${title}
DESCRIPTION: ${description}
KEY POINTS TAUGHT:
${keypoints}

The questions MUST STRICTLY be derived from the KEY POINTS TAUGHT above. Do not invent unrelated questions.
Output ONLY valid JSON. No text before or after.`;

  try {
    const raw = await callGroq(prompt);
    // strip possible markdown fences
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    console.error('AI Q&A generation failed:', error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
}
