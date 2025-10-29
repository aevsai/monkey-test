---
name: "Hacker News Search Test"
description: "Search for AI-related posts on Hacker News and verify results"
timeout: 120
llm_model: "browser-use-llm"
---

# Task

1. Navigate to https://news.ycombinator.com
2. Look at the top 10 posts on the homepage
3. Find and list all posts that mention "AI", "artificial intelligence", or "machine learning" in their titles
4. For each matching post, extract:
   - Title
   - URL/link
   - Points (score)
   - Number of comments

Return the results as a JSON array with the following format:
```json
[
  {
    "title": "Post title here",
    "url": "https://example.com/article",
    "points": 123,
    "comments": 45
  }
]
```

If no matching posts are found in the top 10, return an empty array [].

# Expected Output

Should return a JSON array of posts matching the search criteria. Each post should have all four required fields.