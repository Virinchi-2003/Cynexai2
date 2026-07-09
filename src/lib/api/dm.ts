// In-memory mock store for DM API

let blogPosts: any[] = [];
let seoSettings: Record<string, any> = {};
let idCounter = 1;

export async function getBlogPosts() {
  return [...blogPosts];
}

export async function createBlogPost(post: any) {
  const newPost = { ...post, id: `post-${idCounter++}` };
  blogPosts.push(newPost);
  return newPost;
}

export async function updateBlogPost(id: string, updates: any) {
  const index = blogPosts.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Not found');
  blogPosts[index] = { ...blogPosts[index], ...updates };
  return blogPosts[index];
}

export async function deleteBlogPost(id: string) {
  blogPosts = blogPosts.filter(p => p.id !== id);
}

export async function getScrapedJobs() {
  // Stub
  return [
    { id: 'job-1', title: 'Software Engineer', company: 'Tech Inc' },
    { id: 'job-2', title: 'Product Manager', company: 'Corp LLC' }
  ];
}

export async function triggerJobScraper(source: string) {
  // Stub
  return { status: 'started', source };
}

export async function getAISuggestions(topic: string) {
  // Stub
  return [
    { title: `Top 10 tips for ${topic}`, description: `A comprehensive guide on ${topic}.` },
    { title: `Why ${topic} is the future`, description: `Trends and analysis about ${topic}.` }
  ];
}

export async function getSEOKeywords() {
  // Stub
  return ['AI Marketing', 'Tech Jobs', 'B2B CRM'];
}

export async function updateSEOSettings(pageId: string, settings: any) {
  seoSettings[pageId] = { ...seoSettings[pageId], ...settings };
  return seoSettings[pageId];
}
