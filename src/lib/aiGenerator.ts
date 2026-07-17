const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY is not set in .env');

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
      }
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('No content returned from AI');
  }
  return data.candidates[0].content.parts[0].text;
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
): Promise<{ ppt: string; keypoints: string; script: string }> {
  // Read teacher's custom system prompt from settings (falls back to default)
  const SLIDE_PROMPT_KEY = 'cynexai_slide_system_prompt';
  const defaultPrompt = `You are an expert instructor creating a live class presentation.

Class title: "{{title}}"
{{description}}

CRITICAL: Output EXACTLY 3 sections separated by "---SPLIT---" (use this separator NOWHERE else).

SECTION 1 - PRESENTATION SLIDES (Markdown):
- Generate EXACTLY 12 slides about the topic: "{{title}}"
- DO NOT include any images, photos, or ![] markdown whatsoever
- Each slide MUST be separated by exactly "---" on its own line
- Slide 1: Title slide with just # Title and a one-line tagline as a paragraph
- Slides 2-11: Use # for slide title, then 4-5 bullet points using "-"
- Slide 12: Summary/Key Takeaways slide
- Content MUST be directly about the class topic. Do not mix unrelated subjects.
- Keep bullet points SHORT — max 12 words each
- No sub-headings (##) needed

---SPLIT---

SECTION 2 - TEACHER KEYPOINTS:
For each slide, provide exactly 3 teaching notes (teaching point, analogy, gotcha):
[Slide 1]
- Point: ...
- Analogy: ...
- Gotcha: ...
[Slide 2]
- Point: ...
(continue for all 12 slides)

---SPLIT---

SECTION 3 - TELEPROMPTER SCRIPT:
Write one short welcome paragraph (3-4 sentences) for the teacher to read at the start.`;

  const templatePrompt = localStorage.getItem(SLIDE_PROMPT_KEY) || defaultPrompt;

  // Replace {{title}} and {{description}} placeholders
  const prompt = templatePrompt
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{description\}\}/g, description ? `Additional context: ${description}` : '');

  try {
    const content = await callGemini(prompt);
    const parts = content.split('---SPLIT---');

    if (parts.length >= 3) {
      return {
        ppt: parts[0].trim(),
        keypoints: parts[1].trim(),
        script: parts[2].trim(),
      };
    }

    throw new Error('AI did not return 3 parts');
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
5. ## Resources (suggest 2-3 generic resources like documentation sites, YouTube channels)

Keep it concise but thorough. Use **bold** for key terms. Use inline code for any code/syntax.`;

  try {
    return await callGemini(prompt);
  } catch (error: any) {
    console.error('Post-class summary generation failed:', error);
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    return `## What We Learned\n\n- Core concepts of **${title}**\n- Practical applications in real-world scenarios\n- Key syntax and usage patterns\n\n## Practice Suggestions\n\n1. Build a small project using today's concepts\n2. Review the code examples from the session\n3. Try the coding challenge in the LMS\n\n## Resources\n\n- Search YouTube for "${title} tutorial" for visual learners\n- Practice on [HackerRank](https://hackerrank.com)`;
  }
}

/**
 * Generates MCQ + coding Q&A questions for a class lesson.
 * Returns array of { type, question_text, options, correct_answer_idx, boilerplate, test_cases }
 */
export async function generateAIQuestions(title: string): Promise<Array<{
  type: 'mcq' | 'coding';
  question_text: string;
  options?: string[];
  correct_answer_idx?: number;
  boilerplate?: string;
  test_cases?: string;
}>> {
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
  },
  {
    "type": "coding",
    "question_text": "Write a Python function to ... [describe a task related to ${title}]",
    "boilerplate": "def solution():\\n    # Write your code here\\n    pass",
    "test_cases": "[{\\"input\\": \\"()\\", \\"expected\\": \\"result\\"}]"
  }
]

Generate exactly 3 MCQ questions and 1 coding question related to: ${title}
The questions must be relevant to the class topic and appropriate for beginners.
Output ONLY valid JSON. No text before or after.`;

  try {
    const raw = await callGemini(prompt);
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
