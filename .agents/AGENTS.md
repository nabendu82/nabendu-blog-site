# Project Rules and Workflow Knowledge Base

This file establishes custom rules, context, and workflows for Antigravity in the **nabendu-blog-site** repository.

## Repository Overview
*   **Project Type:** Next.js (App Router) personal portfolio and blog site.
*   **Content Engine:** **Velite** for parsing static `.mdx` files under `content/blog/` into type-safe schema collections (`.velite/`).
*   **Styling:** Tailwind CSS + custom global styles (`app/globals.css`).

## Workflow Rules & Guidelines

### 1. Blog Writing Workflow (Image Descriptions)
*   **User Action:** The user will paste raw Cloudinary image URLs into an MDX file under `content/blog/` (e.g., `![](https://res.cloudinary.com/...)`).
*   **Agent Action:**
    1.  Proactively run a terminal command to download these images to a temporary directory (`tmp_images/`).
    2.  Inspect the downloaded images using the `view_file` tool.
    3.  Analyze the code, simulator screenshots, or diagrams in the images.
    4.  Write clear, instructional, and natural-sounding markdown descriptions for each step shown in the image.
    5.  Place the generated text description **directly above** the corresponding image link in the `.mdx` file.
    6.  Clean up the temporary directory (`rm -rf tmp_images`) when done.

### 2. Dev Server and Configuration
*   **Velite Startup:** Velite must be started programmatically at the top level of next.config.mjs rather than as a Webpack compiler plugin. Running Velite inside Webpack compiler hooks triggers caching/cache invalidation bugs, resulting in `ChunkLoadError` and syntax errors in the browser.
*   Keep `package-lock.json` in sync whenever running npm operations.
