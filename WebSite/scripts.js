const IDEA_STORAGE_KEY = "mirnsIdeaSubmissions";
const LAST_SUBMIT_KEY = "mirnsIdeaLastSubmit";
const MIN_IDEA_LENGTH = 15;
const MAX_IDEA_LENGTH = 300;
const SUBMIT_COOLDOWN_MS = 15000;
const SPAM_WORDS = ["spam", "viagra", "buy now", "click here", "free", "offer"];

function getSavedIdeas() {
  try {
    const stored = localStorage.getItem(IDEA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(IDEA_STORAGE_KEY, JSON.stringify(ideas));
}

function getLastSubmitTime() {
  return parseInt(localStorage.getItem(LAST_SUBMIT_KEY), 10) || 0;
}

function setLastSubmitTime() {
  localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());
}

function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ");
}

function containsSpamWords(text) {
  const lower = text.toLowerCase();
  return SPAM_WORDS.some(word => lower.includes(word));
}

function isLikelySpam(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/(.)\1{10,}/.test(normalized)) {
    return true;
  }

  if (!normalized.length) {
    return false;
  }

  const counts = {};
  for (const char of normalized) {
    counts[char] = (counts[char] || 0) + 1;
  }

  const maxCount = Math.max(...Object.values(counts));
  return maxCount / normalized.length > 0.7;
}

function validateIdeaText(text) {
  const idea = normalizeText(text);

  if (!idea.length) {
    return "Please enter your idea before submitting.";
  }

  if (idea.length < MIN_IDEA_LENGTH) {
    return `Please describe your idea in at least ${MIN_IDEA_LENGTH} characters.`;
  }

  if (idea.length > MAX_IDEA_LENGTH) {
    return `Ideas should be shorter than ${MAX_IDEA_LENGTH} characters.`;
  }

  if (containsSpamWords(idea)) {
    return "Please keep ideas constructive and avoid spammy text.";
  }

  if (isLikelySpam(idea)) {
    return "That submission looks like spam or low-quality content.";
  }

  return "";
}

function renderIdeaCard(idea) {
  const createdAt = new Date(idea.createdAt);
  const timeLabel = createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const titleText = idea.text.length > 60 ? `${idea.text.slice(0, 57)}...` : idea.text;

  return `
    <div class="idea-card">
      <p class="project-label">Idea</p>
      <h3 class="project-title">${escapeHtml(titleText)}</h3>
      <p class="project-description">${escapeHtml(idea.text)}</p>
      <p class="idea-author">— Visitor • ${timeLabel}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderIdeas() {
  const container = document.getElementById("ideas-container");
  if (!container) {
    return;
  }

  const ideas = getSavedIdeas();
  if (!ideas.length) {
    container.innerHTML = `<div class="ideas-empty-message">No ideas yet. Submit one from the homepage to see it here.</div>`;
    return;
  }

  const sorted = [...ideas].sort((a, b) => b.createdAt - a.createdAt);
  container.innerHTML = sorted.map(renderIdeaCard).join("");
}

function showStatusMessage(message, isError = false) {
  const statusEl = document.getElementById("submit-status");
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.style.color = isError ? "#dc2626" : "#047857";
}

function handleFormSubmit(event) {
  event.preventDefault();

  const textarea = document.getElementById("idea-input");
  const message = textarea ? textarea.value : "";
  const validation = validateIdeaText(message);

  if (validation) {
    showStatusMessage(validation, true);
    return;
  }

  const lastSubmit = getLastSubmitTime();
  const now = Date.now();
  if (now - lastSubmit < SUBMIT_COOLDOWN_MS) {
    showStatusMessage("Please wait a few seconds before submitting another idea.", true);
    return;
  }

  const ideas = getSavedIdeas();
  ideas.push({
    text: normalizeText(message),
    createdAt: now,
  });
  saveIdeas(ideas);
  setLastSubmitTime();

  showStatusMessage("Idea saved! Visit the ideas page to view it.");

  if (textarea) {
    textarea.value = "";
  }
}

function initIdeaSubmission() {
  const form = document.getElementById("idea-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", handleFormSubmit);
}

function initPage() {
  initIdeaSubmission();
  renderIdeas();
}

document.addEventListener("DOMContentLoaded", initPage);
