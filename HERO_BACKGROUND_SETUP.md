# Hero Background Image Setup Guide

## Step 1: Run the Migration

1. Open your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Open the file `ADD_HERO_BACKGROUND_IMAGE.sql` from your project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

## Step 2: Add Background Image

### Option A: Using Google Drive (Recommended)

1. Upload your hero background image to Google Drive
2. Right-click the image → Get link → Change to "Anyone with the link"
3. Copy the sharing link (format: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)
4. Convert to direct link format: `https://drive.google.com/uc?export=view&id=FILE_ID`
5. Use this direct link in the admin panel

### Option B: Using External CDN

1. Upload your image to any image hosting service (Imgur, Cloudinary, etc.)
2. Copy the direct image URL
3. Use this URL in the admin panel

## Step 3: Configure in Admin Panel

1. Go to **Admin Panel** → **Homepage Settings**
2. Scroll to the **Hero Section**
3. Find the **Hero Background Image URL** field
4. Paste your image URL
5. Click **Save Changes**

## Image Recommendations

- **Dimensions**: 1920x1080 or higher (16:9 aspect ratio)
- **File Size**: Keep under 500KB for faster loading
- **Format**: JPG or WebP for best performance
- **Subject**: Images with medium contrast work best
- **Avoid**: Very bright or very dark images (text may become hard to read)

## How It Works

- When a background image is set, it replaces the default gradient
- A dark overlay (60-70% opacity) is automatically applied for text readability
- All hero text and buttons remain clearly visible
- If no image is set, the default gradient background is used
- Changes take effect immediately after saving

## Troubleshooting

**Image not showing?**
- Verify the URL is a direct image link (ends in .jpg, .png, etc.)
- For Google Drive, ensure you're using the direct link format
- Check that the image is publicly accessible

**Text hard to read?**
- Choose images with neutral colors in the center
- Avoid extremely bright or complex backgrounds
- The automatic overlay helps, but image choice matters

**Remove background image:**
- Simply clear the URL field and save
- The default gradient will return
