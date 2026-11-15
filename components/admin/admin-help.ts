/**
 * Plain-language help shown at the top of every admin page.
 * One place to edit: add a route prefix, a title and a few steps.
 * (Longest matching prefix wins.)
 */
export type PageHelp = {
  title: string;
  /** one sentence: what is this page for? */
  about: string;
  /** short numbered steps */
  steps?: string[];
  /** things to watch out for */
  tips?: string[];
  /** where the "Back" link goes */
  back?: { href: string; label: string };
};

export const ADMIN_HELP: Record<string, PageHelp> = {
  '/admin/dashboard': {
    title: 'Dashboard',
    about: 'Your starting point. Pick a task below, or use the menu on the left.',
  },

  '/admin/enquiries': {
    title: 'Enquiries',
    about: 'Everyone who filled the contact form or sent a quote request from the 3D planner. These are your leads.',
    steps: ['Read the details of each enquiry.', 'Call or WhatsApp the person as soon as you can; fast replies win events.', 'Use the tick button ("Mark as contacted") once you have replied, so you know who is left.'],
    tips: ['Quote requests from the 3D planner start with "[3D planner quote request]" and include the layout link.'],
  },

  '/admin/events/new': {
    title: 'Add a product',
    about: 'Create a new thing you rent out (a game, photo booth, VR simulator...).',
    steps: ['Fill in the name, a short summary and a full description.', 'Add a main image and gallery photos.', 'Set the price and click Save. Choose "Published" to show it on the site.'],
    tips: ['After saving, open each service it belongs to (Edit) and tick this product under "Related Events" (that is the product list). Then go to Auto Pages: pages for every city are created for you.'],
    back: { href: '/admin/events', label: 'Back to products' },
  },
  '/admin/events': {
    title: 'Products',
    about: 'All the items you rent out. Each product gets its own page on the website.',
    steps: ['Click "Add New Event" to create a product.', 'Use "Edit" on a row to change it, "Delete" to remove it.', 'The star marks a product as featured.', 'Only "Published" products are visible to visitors.'],
    tips: ['These are called "events" in some places. They are the same thing as products.'],
  },

  '/admin/services/new': {
    title: 'Add a service',
    about: 'A service is a group of products, for example "Photo booth rental" or "Team building activities".',
    steps: ['Give it a name and a short summary.', 'Write the page text and add an image.', 'Tick the products that belong to it under "Related Events". A product can be in several services.', 'Save and choose "Published".'],
    tips: ['Then go to Auto Pages to create this service\'s page for every city.'],
    back: { href: '/admin/services', label: 'Back to services' },
  },
  '/admin/services': {
    title: 'Services',
    about: 'Groups of products. Each service has its own page, and one page per city.',
    steps: ['Use the "Edit" button on a row to change a service\'s text and product list.', 'Open a service to reach its city settings (text, SEO, prices) one city at a time.', 'To create all the city pages at once, use Auto Pages instead.'],
  },

  '/admin/blog/new': { title: 'Write a blog post', about: 'Blog posts bring visitors from Google.', steps: ['Write a clear title.', 'Add the text and a picture.', 'Save as Draft to keep working, or Published to go live.'], back: { href: '/admin/blog', label: 'Back to blog' } },
  '/admin/blog': { title: 'Blog', about: 'Articles that help people find you on Google.', steps: ['Click "New Post" to write one.', 'Each post is either Published (visible) or Draft (hidden). You can switch it from the list.'] },

  '/admin/testimonials': { title: 'Testimonials', about: 'What your customers say. Shown on the website.', steps: ['Add a real customer\'s name, event type and comment.', 'Use Edit to change one, or the featured switch to show or hide it.'], tips: ['Only add genuine reviews.'] },
  '/admin/homepage': { title: 'Homepage text', about: 'The headline, button text and images at the top of your homepage.', steps: ['Edit the text.', 'Click Save. Changes appear within about 5 minutes.'] },
  '/admin/about': { title: 'About page', about: 'Your company story page.', steps: ['Edit the text and images.', 'Click Save. Changes appear within about 5 minutes.'] },
  '/admin/media': { title: 'Photos & media', about: 'A list of your picture links. Pictures are not uploaded here: you paste the link of a picture that is already online (for example from Cloudinary or Google Drive).', steps: ['Click add, paste the image link and a file name, category and short description.', 'Use the copy button to copy a link, then paste it where a product, service or blog post asks for an image.'], tips: ['Fill in "Alt text": it helps Google Images and visitors who use screen readers.'] },
  '/admin/settings': { title: 'Site settings', about: 'Phone number, email, social links and other details used all over the website.', steps: ['Change a value.', 'Click Save.'], tips: ['Be careful: these show on every page.'] },

  '/admin/auto-pages': {
    title: 'Auto Pages (AI)',
    about: 'The fast way to create pages. Add a city, and the system writes a unique page for every service and product in it. Nothing goes live until you approve it.',
    steps: [
      'Step 1 - Add or choose a city and fill in its areas, venues and local notes. Tick "City is live" only when you are ready.',
      'Step 2 - Click "Preview (free)" to see exactly which pages are missing. Then click "Write ... drafts".',
      'Step 3 - Read the drafts below. Edit if you like, then Publish (or Publish all).',
      'Step 4 - See every published page at the bottom and click "Check all are live" to test each one on the real website. Use Edit on any row to change its keyword, title, description, text or questions.',
    ],
    tips: [
      'The AI never writes where stock comes from, and never mentions other cities.',
      'New pages are hidden from visitors and Google until you publish them.',
      'If you see "Not signed in as admin", log out and log in again.',
    ],
  },

  '/admin/locations/services-map': { title: 'Services x Cities map (old)', about: 'An old overview screen. Auto Pages does this job now.', back: { href: '/admin/auto-pages', label: 'Go to Auto Pages' } },
  '/admin/locations/bulk-upload': { title: 'Upload cities from a file (old)', about: 'Add many cities from a CSV file. Auto Pages is easier for one city at a time.' },
  '/admin/locations': {
    title: 'Cities (basic list)',
    about: 'The simple list of cities. For new cities use Auto Pages instead, it also stores areas and venues.',
    tips: ['Deleting a city here removes its pages from the site.'],
  },
  '/admin/location-pages': {
    title: 'Old city pages',
    about: 'An older tool. The public website does NOT use these pages. Use Auto Pages instead.',
    tips: ['You can ignore this section.'],
  },

  '/admin/services/': {
    title: 'Service details',
    about: 'Edit one service, or one city of a service.',
    steps: ['Use the buttons and forms on this page.', 'Click Save on each section you change.'],
    back: { href: '/admin/services', label: 'Back to services' },
  },
};

export function helpFor(pathname: string): PageHelp | null {
  let best: string | null = null;
  for (const k of Object.keys(ADMIN_HELP)) {
    if ((pathname === k || pathname.startsWith(k.endsWith('/') ? k : k + '/')) && (!best || k.length > best.length)) best = k;
  }
  // edit pages: /admin/events/<id>/edit etc.
  if (/^\/admin\/events\/[^/]+\/edit/.test(pathname)) return { title: 'Edit product', about: 'Change this product. Click Save at the bottom when done.', back: { href: '/admin/events', label: 'Back to products' } };
  if (/^\/admin\/blog\/[^/]+\/edit/.test(pathname)) return { title: 'Edit blog post', about: 'Change this post. Click Save when done.', back: { href: '/admin/blog', label: 'Back to blog' } };
  if (/^\/admin\/services\/[^/]+\/edit/.test(pathname)) return { title: 'Edit service', about: 'Change this service\'s text, image and product list. Click Save when done.', back: { href: '/admin/services', label: 'Back to services' } };
  if (/^\/admin\/services\/[^/]+\/locations\/[^/]+\/seo/.test(pathname)) return { title: 'City page text and SEO', about: 'The title and description Google shows for this service in this city. Auto Pages can fill these for you.', back: { href: '/admin/services', label: 'Back to services' } };
  if (/^\/admin\/services\/[^/]+\/locations\/[^/]+\/products/.test(pathname)) return { title: 'Products in this city', about: 'Which products show for this service in this city. You normally do not need to do this by hand: Auto Pages does it.', back: { href: '/admin/services', label: 'Back to services' } };
  if (/^\/admin\/services\/[^/]+\/locations/.test(pathname)) return { title: 'Cities for this service', about: 'Choose a city to adjust its text, SEO, price or product list. To create many city pages at once use Auto Pages.', back: { href: '/admin/services', label: 'Back to services' } };
  return best ? ADMIN_HELP[best] : null;
}
