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

  '/admin/keywords': {
    title: 'Keywords',
    about: 'The list of search phrases you want to rank for. Each phrase has ONE owner page, so your pages and blog posts never compete with each other.',
    steps: [
      'Press 1 to register the main keyword of every published page and post.',
      'Press 2 to add phrase ideas for every city (free). The guide-type ideas become blog topics.',
      'Press 3 to fetch how many people search each phrase (needs DataForSEO), or paste a Keyword Planner export.',
      'Look at the list: phrases with the most searches and no owner are your best next pages or posts.',
    ],
    tips: ['A phrase owned by a page cannot be used for a new blog post. Pick a different angle instead.', 'Volumes are monthly searches in India.'],
  },
  '/admin/seo-titles': {
    title: 'Title fixer',
    about: 'Google shows only about 60 characters of a page title and 155 of the description. Longer ones are cut off. This finds those pages and writes tighter versions.',
    steps: [
      'Press 1 to scan your product and service pages (free).',
      'Press 2 to let the AI write shorter versions. It keeps the main search phrase and the city already in the title. Nothing is saved yet.',
      'Read the new text next to the old, edit anything, tick the ones you like, and press 3 to apply.',
    ],
    tips: ['Changes appear on the live pages within about 5 minutes.', 'You can run it again any time; pages that are already good are not listed.'],
  },
  '/admin/products-ai': {
    title: 'Add product with AI',
    about: 'Give the product name, your real facts, the price and your Cloudinary pictures. The AI writes the whole product page, builds the SEO around the most-searched phrase, then writes a page for every city. You approve before anything is public.',
    steps: [
      'Step 1: type the name, the facts you know, the price, and paste your picture links. Press "Write the product page".',
      'Step 2: read the draft. Answer the AI\'s questions if you can, then tick the services the product belongs to and press Publish.',
      'Step 3: press "Write the city pages", read them, and publish them all in one click.',
    ],
    tips: ['The AI never invents sizes, power needs, prices or capacities. What it does not know, it asks you.', 'Nothing is public until you press Publish. City pages are drafts until you approve them.', 'Closed the page halfway? The daily job finishes the city pages by itself (needs CRON_SECRET in Vercel).'],
  },
  '/admin/case-studies': {
    title: 'Our work (case studies)',
    about: 'Real events you delivered, with photos, a short story and (with permission) a client quote. They appear under /our-work and on the matching city and product pages. Nothing is shown to the public until you publish your first one.',
    steps: [
      'Fill in the event: title, type, city, date and the products you used.',
      'Write a few bullet points about what happened, and paste your Cloudinary photo links.',
      'Press "Tidy with AI": it turns your notes into a story and writes picture text. It never adds details you did not give.',
      'Read it, fix anything, and press Publish.',
    ],
    tips: ['Only add real events. A client quote needs their permission: tick the approval box, or it stays hidden.', 'Even 3 to 5 case studies make your city pages look much more trustworthy.'],
  },
  '/admin/blog-ai': {
    title: 'AI Blog writer',
    about: 'Write blog posts that rank for a keyword, link to your real pages, use your pictures and bring enquiries. You approve everything before it is public.',
    steps: [
      'Step 1: choose the city, pick or type the main keyword, describe your idea, paste your Cloudinary picture links (one per line).',
      'Step 2: read the preview, edit if needed, then Publish now, Schedule a time, or Add to queue (next free slot at 10 AM).',
      'Step 3: see what is scheduled and live. Scheduled posts go live by themselves.',
    ],
    tips: ['2 to 3 posts a week looks natural to Google. Use Add to queue and the slots are spaced for you.', 'Every post ends with a quote form, WhatsApp and the 3D planner, so readers can become leads.', 'Posts only link to real pages on your site. Pictures are only the ones you paste.'],
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
