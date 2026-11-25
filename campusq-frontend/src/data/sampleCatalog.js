// Lightweight SVG data-URI illustrations so pre-built templates use 0 bytes in MySQL
const makeThumb = (emoji, bg1, bg2, label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g)"/>
      <text x="200" y="122" font-size="76" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <text x="200" y="205" font-family="sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
    </svg>`
  )}`;

export const SAMPLE_TEMPLATES = {
  CANTEEN: [
    {
      name: 'Masala Dosa',
      description: 'Crispy dosa with potato masala, coconut chutney & sambar',
      price: 45,
      stockQuantity: 30,
      imageUrl: makeThumb('🥞', '#d97706', '#92400e', 'Masala Dosa'),
    },
    {
      name: 'Idli Vada Combo',
      description: '2 soft idlis & 1 crispy medu vada served hot',
      price: 35,
      stockQuantity: 40,
      imageUrl: makeThumb('🍥', '#0f766e', '#115e59', 'Idli Vada'),
    },
    {
      name: 'Samosa (2 pcs)',
      description: 'Crispy spiced potato samosas with mint chutney',
      price: 25,
      stockQuantity: 50,
      imageUrl: makeThumb('🥟', '#b45309', '#78350f', 'Crispy Samosa'),
    },
    {
      name: 'Veg Fried Rice',
      description: 'Hot wok-tossed vegetable fried rice',
      price: 65,
      stockQuantity: 25,
      imageUrl: makeThumb('🍚', '#059669', '#065f46', 'Veg Fried Rice'),
    },
    {
      name: 'Filter Coffee',
      description: 'Freshly brewed South Indian filter coffee',
      price: 20,
      stockQuantity: 60,
      imageUrl: makeThumb('☕', '#78350f', '#451a03', 'Filter Coffee'),
    },
    {
      name: 'Cold Coffee',
      description: 'Chilled blended coffee with chocolate drizzle',
      price: 45,
      stockQuantity: 25,
      imageUrl: makeThumb('🧋', '#4338ca', '#1e1b4b', 'Cold Coffee'),
    },
  ],
  XEROX: [
    {
      name: 'A4 B&W Printout (Per Page)',
      description: 'Sharp black & white laser printout on 75 GSM A4 paper',
      price: 2,
      stockQuantity: null,
      imageUrl: makeThumb('📄', '#334155', '#0f172a', 'A4 B&W Print'),
    },
    {
      name: 'A4 Color Printout (Per Page)',
      description: 'Vibrant color printout for diagrams, charts & covers',
      price: 10,
      stockQuantity: null,
      imageUrl: makeThumb('🖨️', '#0284c7', '#0369a1', 'Color Print'),
    },
    {
      name: 'Spiral Binding',
      description: 'Durable spiral binding with transparent front & back cover',
      price: 35,
      stockQuantity: null,
      imageUrl: makeThumb('📚', '#0f766e', '#134e4a', 'Spiral Binding'),
    },
    {
      name: 'Soft / Project Report Binding',
      description: 'College project report binding with neat cover finish',
      price: 120,
      stockQuantity: null,
      imageUrl: makeThumb('📘', '#1e293b', '#0f172a', 'Project Binding'),
    },
  ],
  STATIONERY: [
    {
      name: 'A4 Spiral Notebook (200 Pages)',
      description: 'Ruled 200-page A4 spiral notebook for lectures',
      price: 60,
      stockQuantity: 40,
      imageUrl: makeThumb('📓', '#0f766e', '#065f46', 'A4 Notebook'),
    },
    {
      name: 'Blue Gel Pen Pack (5 Pens)',
      description: 'Smooth-writing 0.5mm blue gel pens',
      price: 50,
      stockQuantity: 35,
      imageUrl: makeThumb('🖊️', '#1d4ed8', '#1e3a8a', 'Gel Pen Pack'),
    },
    {
      name: 'Lab Observation & Record Book',
      description: 'Standard engineering lab record book (100 pages)',
      price: 85,
      stockQuantity: 30,
      imageUrl: makeThumb('📒', '#d97706', '#92400e', 'Lab Record'),
    },
    {
      name: 'Engineering Drawing Sheets (Set of 10)',
      description: 'Heavyweight A2 drawing sheets for ED lab',
      price: 70,
      stockQuantity: 25,
      imageUrl: makeThumb('📐', '#475569', '#1e293b', 'Drawing Sheets'),
    },
  ],
  OTHER: [
    {
      name: 'Cappuccino',
      description: 'Fresh espresso with steamed milk foam',
      price: 55,
      stockQuantity: 30,
      imageUrl: makeThumb('☕', '#78350f', '#451a03', 'Cappuccino'),
    },
    {
      name: 'Fresh Watermelon Juice',
      description: 'Chilled fresh-pressed seasonal juice',
      price: 40,
      stockQuantity: 25,
      imageUrl: makeThumb('🥤', '#e11d48', '#881337', 'Fresh Juice'),
    },
    {
      name: 'Grilled Veg Sandwich',
      description: 'Toasted sandwich with cheese, veggies & mint chutney',
      price: 50,
      stockQuantity: 20,
      imageUrl: makeThumb('🥪', '#059669', '#064e3b', 'Veg Sandwich'),
    },
    {
      name: 'Chocolate Brownie',
      description: 'Warm fudgy chocolate brownie',
      price: 45,
      stockQuantity: 20,
      imageUrl: makeThumb('🍫', '#451a03', '#1c1917', 'Brownie'),
    },
  ],
};

export function fileToBase64DataUrl(file, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`File "${file.name}" is larger than 2 MB. Please choose a smaller file.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
