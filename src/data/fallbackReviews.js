// Built-in offline fallback reviews tuned for K.M. Handloom's local Patna SEO.
// Each review stays natural (2-3 sentences, under 48 words) with authentic local keywords.

const PRODUCT_PHRASES = {
  english: {
    Curtains: 'door and window curtains',
    Bedsheets: 'cotton king size bedsheets',
    'Blankets & Razai': 'mink blankets and winter razai',
    'Mattress & Pillows': 'an orthopedic mattress and sleeping pillows',
    'Sofa Covers & Doormats': 'velvet sofa covers and anti-skid doormats',
    'Wholesale / Bulk': 'bulk handloom items at wholesale rates',
  },
  hinglish: {
    Curtains: 'door aur window parda',
    Bedsheets: 'cotton chadar aur bedsheet',
    'Blankets & Razai': 'kambal aur razai',
    'Mattress & Pillows': 'gadda aur takiya',
    'Sofa Covers & Doormats': 'velvet sofa cover aur doormat',
    'Wholesale / Bulk': 'wholesale rate par handloom saman',
  },
};

const TAG_PHRASES = {
  english: {
    'Great Quality': 'the fabric quality really stood out',
    'Wholesale & Fair Prices': 'rates are very reasonable even compared to wholesale markets',
    'Helpful Staff': 'the staff was patient and helpful',
    'Good Variety': 'they have a wide home furnishing collection',
    'Wedding / Gift Sets': 'their wedding bedding and blanket sets look lovely',
    'Clean Store': 'the store is neat and well organized',
  },
  hinglish: {
    'Great Quality': 'kapde aur fabric ki quality kaafi acchi lagi',
    'Wholesale & Fair Prices': 'wholesale aur retail dono rates kaafi reasonable hain',
    'Helpful Staff': 'staff bahut polite aur helpful tha',
    'Good Variety': 'variety aur collection badiya hai',
    'Wedding / Gift Sets': 'shaadi ke liye kambal aur bedsheet set kaafi ache mil gaye',
    'Clean Store': 'dukan kaafi saaf aur well-maintained hai',
  },
};

function cleanDisplayShopName(shopName) {
  if (!shopName || typeof shopName !== 'string') return 'K.M. Handloom';
  const unwrapped = shopName.trim().replace(/^\[(.*)\]$/, '$1').trim();
  if (!unwrapped || /^your shop name$/i.test(unwrapped)) {
    return 'K.M. Handloom';
  }
  return unwrapped;
}

function buildProductMention(products, language, index) {
  const map = PRODUCT_PHRASES[language] || PRODUCT_PHRASES.english;
  if (Array.isArray(products) && products.length > 0) {
    const picked = products
      .slice(0, 2)
      .map((item) => map[item] || item.toLowerCase());
    return picked.join(language === 'hinglish' ? ' aur ' : ' and ');
  }

  const defaults =
    language === 'hinglish'
      ? [
          'parda aur cotton chadar',
          'kambal aur razai',
          'sofa cover aur bedsheet',
          'gadda aur takiya',
        ]
      : [
          'curtains and cotton bedsheets',
          'mink blankets and quilts',
          'sofa covers and home furnishings',
          'bedsheets and pillows',
        ];
  return defaults[Math.abs(index) % defaults.length];
}

function buildTagSentence(tags, language) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  const map = TAG_PHRASES[language] || TAG_PHRASES.english;
  const phrases = tags
    .slice(0, 2)
    .map((tag) => map[tag] || tag.toLowerCase());

  if (language === 'hinglish') {
    if (phrases.length === 1) {
      return `Especially ${phrases[0]}.`;
    }
    return `Especially ${phrases[0]} aur ${phrases[1]}.`;
  }

  if (phrases.length === 1) {
    return `Really appreciated that ${phrases[0]}.`;
  }
  return `Really liked that ${phrases[0]} and ${phrases[1]}.`;
}

export function getFallbackReview({
  rating = 5,
  language = 'english',
  shopName = 'K.M. Handloom',
  products = [],
  tags = [],
  index = 0,
}) {
  const store = cleanDisplayShopName(shopName);
  const itemText = buildProductMention(products, language, index);
  const tagNote = buildTagSentence(tags, language);

  const templates = {
    english: {
      5: [
        `Bought ${itemText} from ${store} in Dariyapur, Patna and had a great experience. ${tagNote || 'Fabric quality is solid and prices are very fair for Patna.'} Easily one of the best handloom shops nearby.`,
        `Stopped by ${store} near Kadam Kuan, Patna for ${itemText}. ${tagNote || 'Good collection to choose from and the staff helped patiently.'} Will definitely come back for more home furnishings.`,
        `Really happy with the ${itemText} I picked up at ${store}, Patna. ${tagNote || 'Reasonable wholesale-style pricing and neat display throughout the store.'} Gladly recommend this handloom shop.`,
      ],
      4: [
        `Visited ${store} on Nala Road, Patna for ${itemText} and had a smooth shopping visit. ${tagNote || 'Nice variety and sensible prices overall.'} A reliable local handloom store in Dariyapur.`,
        `Picked up ${itemText} from ${store} in Patna today. ${tagNote || 'Decent fabric quality and courteous staff.'} Worth checking out if you need curtains or bedding nearby.`,
      ],
    },
    hinglish: {
      5: [
        `Dariyapur, Patna mein ${store} se ${itemText} liya aur experience bahut accha raha. ${tagNote || 'Quality badiya hai aur rates bhi kaafi reasonable lage.'} Patna mein handloom shopping ke liye badhiya dukan hai.`,
        `Kadam Kuan, Patna mein ${store} par ${itemText} lene gaya tha. ${tagNote || 'Collection kaafi acchi hai aur staff ne aaram se sab dikhaya.'} Family ke saath dobara zaroor aunga.`,
        `Aaj ${store}, Nala Road Patna se ${itemText} kharida. ${tagNote || 'Sasta aur accha handloom saman mil gaya bina kisi jhanjhat ke.'} Zaroor recommend karunga.`,
      ],
      4: [
        `Patna ke Dariyapur area mein ${store} se ${itemText} liya. ${tagNote || 'Options kaafi mil gaye aur staff ka behaviour bhi accha tha.'} Acchi local handloom dukan hai.`,
        `${store}, Patna mein ${itemText} ke liye visit kiya tha. ${tagNote || 'Variety theek hai aur price bhi sahi laga.'} Dobara shopping karna pasand karunga.`,
      ],
    },
  };

  const langBucket = templates[language] || templates.english;
  const ratingBucket = langBucket[rating] || langBucket[5];
  const chosen = ratingBucket[Math.abs(index) % ratingBucket.length];
  return chosen.replace(/\s+/g, ' ').trim();
}
