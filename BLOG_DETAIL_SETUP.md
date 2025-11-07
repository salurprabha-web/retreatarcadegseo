# Blog Detail Page Setup Guide

## Step 1: Run the Migration

1. Open your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Open the file `ADD_BLOG_CONTENT_IMAGES.sql` from your project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This migration adds the following columns to the `blog_posts` table:
- `featured_image_url` - Main blog post image (renamed from `image_url`)
- `content_images` - Array of images to display within the blog content
- `reading_time` - Estimated reading time (e.g., "5 min read")
- `tags` - Array of tags for categorization

## Step 2: Create or Edit Blog Posts

### Using the Admin Panel

1. Go to **Admin Panel** → **Blog**
2. Click **New Blog Post** or edit an existing post
3. Fill in all the required fields

### Basic Information
- **Title**: Blog post title
- **URL Slug**: Auto-generated from title, or customize
- **Excerpt**: Brief summary shown in blog list
- **Content**: Full blog post content with **HTML formatting support**

### Metadata
- **Author Name**: Author's name
- **Category**: Blog category (e.g., "Wedding Tips", "Event Planning")
- **Featured Image URL**: Main image shown at the top
- **Reading Time**: Estimated reading time (e.g., "5 min read")
- **Tags**: Comma-separated tags (e.g., "event planning, weddings, tips")

### Content Writing with HTML

The content field supports full HTML formatting. You can use any HTML tags:

**Supported HTML Tags**:
- `<h2>`, `<h3>` - Headings (styled automatically)
- `<p>` - Paragraphs
- `<strong>`, `<b>` - Bold text
- `<em>`, `<i>` - Italic text
- `<ul>`, `<ol>`, `<li>` - Lists
- `<a href="...">` - Links
- `<br>` - Line breaks

**Example Content**:
```html
<h2>Planning Your Dream Wedding</h2>
<p>Your wedding day is one of the most important days of your life.</p>

<h3>1. Set a Realistic Budget</h3>
<p>Before diving into planning, establish a clear budget.</p>

<h3>2. Choose the Perfect Venue</h3>
<p>Your venue sets the tone for your entire wedding.</p>
```

### Content Images (Advanced)

Content images are displayed in a gallery section at the bottom of the blog post.

**Format**: JSON array of image objects

**Example**:
```json
[
  {
    "url": "https://images.pexels.com/photos/123/wedding.jpg",
    "caption": "Beautiful wedding decoration setup",
    "alt": "Wedding decoration with flowers"
  },
  {
    "url": "https://drive.google.com/uc?export=view&id=FILE_ID",
    "caption": "Reception hall arrangement",
    "alt": "Reception hall"
  }
]
```

**Fields**:
- `url` (required): Direct image URL
- `caption` (optional): Text shown below the image
- `alt` (required): Alt text for accessibility

## Blog Detail Page Features

### Magazine-Style Design
- Full-width featured image with overlay
- Large, readable typography
- Content images placed strategically throughout
- Professional layout with proper spacing
- Tags displayed at the bottom
- Responsive design for all devices

### Unique Image Placement
- Featured image at the top with gradient overlay
- Content images displayed in a gallery at the bottom
- Each image has caption and proper styling
- Images are rounded with shadow effects
- Professional presentation with spacing

### Reading Experience
- Large excerpt with left border highlight
- Justified text for professional look
- Proper paragraph spacing
- Author, date, and reading time metadata
- Category badge
- Tag chips for easy navigation
- Back to blog navigation

## Image Recommendations

### Featured Image
- Dimensions: 1920x1080 or 1600x900
- Format: JPG or WebP
- Size: Under 500KB

### Content Images
- Dimensions: 1200x800 or 1600x900
- Format: JPG or WebP
- Size: Under 300KB each
- Use 2-4 images per blog post

## Content Writing Tips

1. **Use HTML tags** for proper formatting and structure
2. **Use heading tags** (`<h2>`, `<h3>`) to organize content
3. **Wrap text in `<p>` tags** for proper paragraph spacing
4. **Add captions** to content images for context
5. **Use descriptive alt text** for accessibility
6. **Keep paragraphs** to 3-5 sentences for readability

## Example Blog Post Structure

```html
<h2>Main Title</h2>
<p>Introduction paragraph with context.</p>

<h3>Section 1</h3>
<p>Content for section 1.</p>
<p>More details about section 1.</p>

<h3>Section 2</h3>
<p>Content for section 2.</p>

<p>Conclusion paragraph.</p>
```

## Troubleshooting

**404 Error on Blog Detail Page?**
- Ensure the migration has been run
- Check that the blog post status is "published"
- Verify the slug is correct

**Content Images Not Showing?**
- Check JSON format is valid
- Ensure URLs are direct image links
- Verify images are publicly accessible

**Images Not Aligned Properly?**
- Images automatically insert every 3 paragraphs
- Add more paragraphs if needed
- Images appear in the order they're listed in the JSON array

**Tags Not Displaying?**
- Use comma-separated format in admin panel
- Tags will automatically be parsed and displayed
- Example: "wedding, planning, tips, decoration"
