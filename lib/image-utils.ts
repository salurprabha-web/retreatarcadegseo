export function convertToDirectImageUrl(url: string): string {
  if (!url) return '';

  if (url.includes('drive.google.com')) {
    let fileId = '';

    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('id=')) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('/open?id=')) {
      const match = url.match(/open\?id=([^&]+)/);
      if (match) fileId = match[1];
    }

    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    return url.replace('dl=0', 'dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return url;
}

export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
