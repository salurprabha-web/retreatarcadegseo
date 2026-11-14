/**
 * Hand-written local content for the city landing pages (/locations/<slug>).
 *
 * Rules for everything in this file:
 *  - Only claims that are true for Retreat Arcade today (it serves events in these cities).
 *  - No fake local office, address, phone number, review or "events delivered" figure.
 *  - Content is written per city (not a find-and-replace template) so the pages are genuinely different.
 *
 * To add another city later: copy one entry, change the slug, name, areas and text, and it appears
 * on /locations, the city page and the sitemap automatically.
 */

export type CityFaq = { q: string; a: string };

export type City = {
  slug: string;
  name: string;
  /** common way people search for the city, shown in titles */
  alias?: string;
  state: string;
  /** true only for the city where the business is actually based */
  home?: boolean;
  /** approximate centre of the city, used for areaServed */
  geo: { lat: number; lng: number };
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroLine: string;
  intro: string[];
  areas: string[];
  venues: string[];
  occasions: { title: string; text: string }[];
  faqs: CityFaq[];
  nearby?: string[];
};

export const CITIES: City[] = [
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    home: true,
    geo: { lat: 17.385, lng: 78.4867 },
    metaTitle: 'Event Game & Photobooth Rentals Hyderabad | Retreat Arcade',
    metaDescription:
      'Hire interactive games, 360° photo booths, VR simulators and team-building activities for events in Hyderabad. Corporate, wedding and college fest packages.',
    keywords: ['event rentals Hyderabad', 'photo booth rental Hyderabad', 'interactive games rental Hyderabad', '360 photo booth Hyderabad', 'VR simulator rental Hyderabad', 'team building activities Hyderabad', 'college fest games Hyderabad'],
    heroLine: 'Interactive games, photo booths and VR for events across Hyderabad.',
    intro: [
      'Retreat Arcade is based in Madhapur, Hyderabad, and rents interactive games, 360° photo booths, VR simulators, AI experiences and team-building activities for corporate events, weddings, college fests and brand activations across the city.',
      'Hyderabad hosts everything from large annual days in HITEC City and Gachibowli to intimate sangeet evenings in Banjara Hills and Jubilee Hills. We help you match the right attractions to the crowd, the space and the schedule, so guests are engaged instead of standing in queues.',
      'Not sure where to start? Open the 3D event planner, drop attractions into a virtual venue the size of yours, and send us the plan for a quote.',
    ],
    areas: [
      'Madhapur',
      'HITEC City',
      'Gachibowli',
      'Kondapur',
      'Financial District',
      'Banjara Hills',
      'Jubilee Hills',
      'Begumpet',
      'Secunderabad',
      'Kukatpally',
      'Miyapur',
      'Manikonda',
      'Uppal',
      'LB Nagar',
    ],
    venues: [
      'Hotels, banquet halls and convention centres',
      'Corporate campuses and IT parks',
      'College and university campuses',
      'Farmhouses and resorts on the city outskirts',
      'Clubs, community halls and apartment communities',
    ],
    occasions: [
      { title: 'Corporate events & annual days', text: 'Team-building games, VR and photo booths that keep large teams mixing and give your brand something to share.' },
      { title: 'Weddings & sangeet', text: 'Mirror booths, 360° booths and games that guests of every age enjoy between the ceremonies.' },
      { title: 'College fests', text: 'High-energy arcade and sports games that handle big crowds across a multi-day fest.' },
      { title: 'Brand activations & exhibitions', text: 'Crowd-pulling experiences for malls, expos and launch events that bring footfall to your stall.' },
      { title: 'Birthdays & family events', text: 'Easy, safe fun for kids and grown-ups, from claw machines to giant board games.' },
    ],
    faqs: [
      { q: 'Which areas of Hyderabad do you serve?', a: 'We serve events across Hyderabad, including Madhapur, HITEC City, Gachibowli, Kondapur, Banjara Hills, Jubilee Hills, Secunderabad, Kukatpally and the surrounding areas. Share your venue and date and we will confirm availability.' },
      { q: 'How do I get a quote for my event?', a: 'Use the 3D event planner to choose your attractions and venue layout, then send the plan to us. You can also message us on WhatsApp with your date, venue and guest count.' },
      { q: 'How early should I book for a weekend or wedding-season date?', a: 'Popular weekends and wedding-season dates fill up first, so we recommend enquiring as early as you can. Last-minute requests are still worth asking about.' },
      { q: 'Can I mix different attractions at one event?', a: 'Yes. Most clients combine a photo booth with games or VR so that different age groups all have something to do. The planner shows how much floor space each combination needs.' },
      { q: 'Do you handle corporate and college events as well as weddings?', a: 'Yes. We provide attractions for corporate events, weddings, college fests, brand activations, exhibitions and family celebrations.' },
    ],
    nearby: ['Secunderabad', 'Medchal', 'Shamshabad', 'Sangareddy'],
  },
  {
    slug: 'visakhapatnam',
    name: 'Visakhapatnam',
    alias: 'Vizag',
    state: 'Andhra Pradesh',
    geo: { lat: 17.6868, lng: 83.2185 },
    metaTitle: 'Event Game & Photobooth Rentals in Vizag | Retreat Arcade',
    metaDescription:
      'Interactive games, 360° photo booths, VR and team-building activities for events in Visakhapatnam (Vizag). Plan your setup in 3D and get a quick quote.',
    keywords: ['event rentals Vizag', 'photo booth rental Visakhapatnam', 'photo booth rental Vizag', 'interactive games rental Vizag', '360 photo booth Visakhapatnam', 'VR simulator rental Visakhapatnam', 'team building activities Vizag', 'corporate event entertainment Visakhapatnam'],
    heroLine: 'Interactive games, photo booths and VR for events in Visakhapatnam (Vizag).',
    intro: [
      'Planning an event in Visakhapatnam (Vizag)? Retreat Arcade provides interactive games, 360° photo booths, VR simulators, AI experiences and team-building activities for corporate events, weddings, college fests and brand activations in the city.',
      'From beach-side celebrations along Beach Road and Rushikonda to corporate programmes in Madhurawada and wedding receptions in MVP Colony and Siripuram, Vizag events come in every shape. We help you pick attractions that suit the venue, the guest list and the time you have.',
      'Share your date and venue, or build the layout yourself in our 3D event planner, and we will come back with availability and a quote.',
    ],
    areas: [
      'Beach Road',
      'Rushikonda',
      'Madhurawada',
      'MVP Colony',
      'Dwaraka Nagar',
      'Siripuram',
      'Seethammadhara',
      'Gajuwaka',
      'Gopalapatnam',
      'Pendurthi',
      'Bheemunipatnam',
    ],
    venues: [
      'Beach-side resorts and hotels',
      'Convention halls and banquet halls',
      'IT and corporate offices around Rushikonda and Madhurawada',
      'College and university campuses',
      'Community halls, clubs and apartment communities',
    ],
    occasions: [
      { title: 'Corporate events & annual days', text: 'Team-building games, VR and photo booths for company get-togethers, product launches and employee engagement days.' },
      { title: 'Weddings & receptions', text: 'Photo booths and games that keep guests entertained between the ceremonies and the dinner.' },
      { title: 'College fests', text: 'Arcade and sports attractions that keep campus fests busy and easy to run.' },
      { title: 'Beach-side & resort events', text: 'Attractions that suit open-air and resort venues, from sunset parties to team outings.' },
      { title: 'Brand activations & exhibitions', text: 'Experiences that draw crowds to your stall at expos, malls and promotional events.' },
    ],
    faqs: [
      { q: 'Do you provide event entertainment in Visakhapatnam (Vizag)?', a: 'Yes. We provide interactive games, photo booths, VR and team-building activities for events in Visakhapatnam, including Beach Road, Rushikonda, Madhurawada, MVP Colony, Siripuram and Gajuwaka. Share your date and venue and we will confirm availability.' },
      { q: 'How do I get a quote for an event in Vizag?', a: 'Open the 3D event planner, choose your attractions and venue layout, and send us the plan. You can also message us on WhatsApp with your date, venue and guest count.' },
      { q: 'Can I see how the attractions will fit in my venue?', a: 'Yes. The planner lets you set the size of the hall or lawn, place attractions, add a stage and seating, and take a guided 3D tour before you decide.' },
      { q: 'Which kinds of events do you cover in Vizag?', a: 'Corporate events and annual days, weddings and receptions, college fests, brand activations, exhibitions, birthdays and family celebrations.' },
      { q: 'Should I book early for beach-side or festival dates?', a: 'Dates around holidays and the wedding season are in demand, so it helps to enquire early. We will tell you what is possible for your date.' },
    ],
    nearby: ['Vizianagaram', 'Anakapalle', 'Bheemili'],
  },
];

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
