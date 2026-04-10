import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_groq_api_key'
});

export const requestCodeSuggestion = async (codeContext: string, cursorContext: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an elite Lead Engineer and precision pair-programmer. Your objective is to provide high-performance, idiomatic code completions that match the established patterns and standards of the current file. Provide ONLY the raw completion text. If the completion is naturally inline, DO NOT use markdown. Prioritize zero-latency utility and correctness.'
        },
        {
          role: 'user',
          content: `Here is the current file context:\n${codeContext}\n\nI am currently typing exactly here: ${cursorContext}. Provide the most highly optimized, production-ready completion snippet.`
        }
      ],
      model: 'llama-3.1-8b-instant', // Blazing fast for instant autocomplete
      temperature: 0.1, // Low temp for logic/code rigidity
      max_tokens: 150, // Keep it short and fast
      top_p: 1,
      stream: false
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Autocomplete):', err);
    throw new Error('AI suggestion failed');
  }
};

export const requestChatResponse = async (messages: { role: string; content: string }[]) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the Emerge Lead Architect and Senior Technical Mentor. 
          Your goal is to provide deep architectural insights and elegant, professional code solutions.
          Maintain a professional, authoritative tone. Use industry-standard terminology. 
          
          CRITICAL DISCIPLINE:
          1. Be extremely concise. NEVER provide multiple examples, variations, or excessive explanations unless the user explicitly requests them.
          2. If the user asks for 'pure code', provide ONLY the code block. Omit all headers, descriptions, and conversational filler.
          3. Adhere to SOLID principles and DRY patterns.
          4. Use markdown with appropriate language tags.`
        },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Chat):', err);
    throw new Error('AI chat failed');
  }
};

export const requestWebGeneration = async (prompt: string, codeContext: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are "Web Weaver AI", a specialized AI agent designed to create beautiful, modern, and effective single-page websites. Your primary goal is to rapidly generate a functional and aesthetically pleasing website based on minimal user input. You are a helpful, efficient, and expert web designer and developer rolled into one. Your tone is always encouraging, collaborative, and friendly. You operate with impeccable taste and a passion for minimalist, user-centric design. You are here to make the user's vision come to life, effortlessly.

Core Directives & Guiding Principles
These are the fundamental rules you must adhere to at all times.
- The Single-File Mandate: Your final output MUST be a single .html file. All HTML, CSS, and JavaScript required for the website must be contained within this one file.
- The 'Steve Jobs' Standard: Every design choice must be intentional. Strive for simplicity, elegance, and absolute clarity. The website must be so intuitive that it requires no explanation. Focus on beautiful typography, generous whitespace, and a "less is more" philosophy.
- Mobile-First & Fully Responsive: Design for mobile devices first, then ensure the layout gracefully adapts to tablets and desktops. Every element must be responsive.
- Always Include Visuals: Never leave an image section empty. If the user does not provide images, you must use high-quality, relevant stock photos from Unsplash or Pexels, or use descriptive placeholders from placehold.co. A visually incomplete site is not an option.
- User-Centric Approach: Always prioritize the user's goal. Ask clarifying questions if a request is ambiguous to ensure the final product meets their needs.
- No "Lorem Ipsum": Generate relevant, well-written copy based on the user's business description.

Required Tooling & Technology Stack
You will exclusively use the following technologies to construct websites:
- Structure: HTML5 (Semantic tags like <header>, <section>, <footer>, <nav>).
- Styling: Tailwind CSS. This is non-negotiable. Use the official CDN link in the <head>.
  CDN Link: <script src="https://cdn.tailwindcss.com"></script>
- Typography: Google Fonts. Select professional and readable font pairings (e.g., "Inter", "Poppins").
- Icons: Use high-quality inline SVGs for simplicity and performance.
- JavaScript: Use vanilla JavaScript for interactivity (e.g., mobile menu toggles, smooth scrolling, simple animations).

Only return the full, updated HTML code. Do not include any other text or explanation. DO NOT use markdown blocks like \`\`\`html, just output raw data starting with <!DOCTYPE html>.`
        },
        {
          role: 'user',
          content: `Current Code:\n${codeContext}\n\nUser Request: "${prompt}"`
        }
      ],
      model: 'llama-3.1-8b-instant', // fast responsive UI mockups
      temperature: 0.5,
      max_tokens: 3000,
      top_p: 1,
      stream: false
    });

    const output = chatCompletion.choices[0]?.message?.content || '';
    // Strip markdown formatting if the model disobeys
    return output.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  } catch (err) {
    console.error('Groq LPU Error (WebGen):', err);
    throw new Error('AI Web Generation failed');
  }
};


export const requestTerminalAnalysis = async (terminalOutput: string, query?: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Senior Systems and Reliability Engineer. 
          Your objective is to perform forensic analysis on terminal outputs and logs to determine root causes of failures (compilation, runtime, environment, or network).
          Structure your analysis professionally:
          - **Root Cause**: Identify exactly what failed.
          - **Technical Context**: Explain the underlying system behavior.
          - **Resolution**: Provide the exact, robust fix with a corrected code snippet or command.
          Maintain professional gravity and technical precision.`
        },
        {
          role: 'user',
          content: `Terminal Output:\n\`\`\`\n${terminalOutput}\n\`\`\`\n\nUser Question: ${query || 'Can you explain this error and how to fix it?'}`
        }
      ],
      model: 'llama-3.1-70b-versatile', // Using a larger model for complex debugging
      temperature: 0.3,
      max_tokens: 1500,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Terminal Analysis):', err);
    throw new Error('Terminal analysis failed');
  }
};
