// OpenRouter API for AI-powered class material generation
// Model: google/gemini-flash-1.5 (fast, high-quality, free tier available)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const MODEL = 'openai/gpt-3.5-turbo';

async function callOpenRouter(prompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cynexai.com',
      'X-Title': 'CynexAI LMS',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No content returned from AI');
  }
  return data.choices[0].message.content as string;
}

/**
 * Generates three items for a live class:
 *  1. Markdown slides (for Reveal.js / presentation view)
 *  2. Bullet-point keypoints for teacher reference
 *  3. Teleprompter script with localized Hyderabad examples
 */
export async function generateAIMaterials(
  title: string,
  description: string = ''
): Promise<{ ppt: string; keypoints: string; script: string }> {
  const prompt = `You are an expert curriculum designer and teacher trainer for CynexAI, an EdTech company in Hyderabad, India.

Create content for a live online class titled: "${title}"
${description ? `Context: ${description}` : ''}

Generate EXACTLY 3 sections separated by the delimiter ---SPLIT--- (do not use it anywhere else):

SECTION 1 - PRESENTATION SLIDES:
Write 5-8 slides in Markdown. Rules:
- Use # for slide title (becomes the heading)
- Use ## for sub-headings within slides
- Separate slides with exactly ---
- Use bullet points (- ) for content
- Keep each slide focused (5-7 bullet max)
- Do NOT wrap in code blocks
- Last slide should be "Key Takeaways"

---SPLIT---

SECTION 2 - TEACHER KEYPOINTS:
Write 5-7 key teaching points / analogies the teacher should remember.
- Use real-world analogies relevant to Hyderabad (Biryani, Charminar, HITEC City, local IT companies)
- Format as bullet points starting with -
- Each point should be a memorable insight or teaching technique

---SPLIT---

SECTION 3 - TELEPROMPTER SCRIPT:
Write a natural-sounding 3-4 paragraph script the teacher reads during the class.
- Informal, conversational tone (like a senior engineer teaching juniors)
- Include 1-2 local references (Hyderabad / Telangana)
- Start with a brief introduction, then key concepts, then close with what's next
- No slide numbering needed, just flowing narrative`;

  try {
    const content = await callOpenRouter(prompt);
    const parts = content.split('---SPLIT---');

    if (parts.length >= 3) {
      return {
        ppt: parts[0].trim(),
        keypoints: parts[1].trim(),
        script: parts[2].trim(),
      };
    }

    // Fallback if the model didn't follow the format
    console.warn('AI did not return 3 parts, using fallback split');
    return {
      ppt: `# ${title}\n\n## Overview\n- Key concept 1\n- Key concept 2\n- Key concept 3\n\n---\n\n# Key Takeaways\n\n- Remember: ${title} is important\n- Practice daily\n- Ask questions`,
      keypoints: `- Core concept: ${title} is used for real-world problem solving\n- Analogy: Think of it like the Charminar — a strong foundation supports everything\n- Practice matters more than theory`,
      script: `Welcome everyone! Today we're covering ${title}. This is one of the most important topics you'll learn. Let's dive in together and make sure everyone understands before we move on.`,
    };
  } catch (error) {
    console.error('AI Material generation failed:', error);
    // Return meaningful fallback so teacher isn't blocked
    return {
      ppt: `# ${title}\n\n## What We'll Cover\n- Introduction to ${title}\n- Core concepts and syntax\n- Real-world examples\n- Practice problems\n\n---\n\n# Getting Started\n\n## Prerequisites\n- Basic computer knowledge\n- Curiosity and willingness to learn\n- Your development environment\n\n---\n\n# Key Concepts\n\n## The Basics\n- Concept 1: Foundation\n- Concept 2: Application\n- Concept 3: Best Practices\n\n---\n\n# Key Takeaways\n\n- ${title} is a powerful tool\n- Practice every day\n- Build projects to solidify understanding`,
      keypoints: `- ${title} forms the backbone of modern software development\n- Use analogies: like building a house — you need a blueprint first\n- Common mistake: rushing to code without understanding the problem\n- Hyderabad IT sector heavily uses these concepts at companies in HITEC City\n- Encourage students to code along, not just watch`,
      script: `Good morning everyone! Today we're going to explore ${title} together. Before we start, I want you to open your code editor because we're going to code along as we go. In HITEC City companies, they use these exact concepts every single day. So let's make sure you understand this well. Follow along step by step, and don't hesitate to ask questions in the chat!`,
    };
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
    return await callOpenRouter(prompt);
  } catch (error) {
    console.error('Post-class summary generation failed:', error);
    return `## What We Learned\n\n- Core concepts of **${title}**\n- Practical applications in real-world scenarios\n- Key syntax and usage patterns\n\n## Practice Suggestions\n\n1. Build a small project using today's concepts\n2. Review the code examples from the session\n3. Try the coding challenge in the LMS\n\n## Resources\n\n- [Official Documentation](https://docs.python.org) — Start here\n- Search YouTube for "${title} tutorial" for visual learners\n- Practice on [HackerRank](https://hackerrank.com)`;
  }
}
