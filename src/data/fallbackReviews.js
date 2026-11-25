// Built-in offline fallback reviews used if the Gemini API call fails or rate-limits.
// Each review stays concise (2-3 sentences, under 45 words) and sounds like a real customer.

const TAG_PHRASES = {
  english: {
    'Great Quality': 'the fabric quality really stood out',
    'Good Curtain Variety': 'they have a great curtain and handloom collection',
    'Reasonable Prices': 'prices felt fair for the quality',
    'Helpful Staff': 'the staff was patient and helpful',
    'Good Variety': 'they have a nice range to pick from',
    'Clean Store': 'the store is neat and well kept',
  },
  hinglish: {
    'Great Quality': 'kapde aur fabric ki quality kaafi acchi lagi',
    'Good Curtain Variety': 'curtains aur handloom ki variety badiya hai',
    'Reasonable Prices': 'rates bhi kaafi reasonable hain',
    'Helpful Staff': 'staff bahut polite aur helpful tha',
    'Good Variety': 'collection aur variety badiya hai',
    'Clean Store': 'dukan kaafi saaf aur well-maintained hai',
  },
};

function cleanDisplayShopName(shopName) {
  if (!shopName || typeof shopName !== 'string') return 'this store';
  const unwrapped = shopName.trim().replace(/^\[(.*)\]$/, '$1').trim();
  if (!unwrapped || /^your shop name$/i.test(unwrapped)) {
    return 'this store';
  }
  return unwrapped;
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
  shopName = '',
  tags = [],
  index = 0,
}) {
  const store = cleanDisplayShopName(shopName);
  const tagNote = buildTagSentence(tags, language);

  const templates = {
    english: {
      5: [
        `Visited ${store} recently and had a really smooth shopping experience. ${tagNote || 'Found exactly what I was looking for without any hassle.'} Will definitely come back again.`,
        `Stopped by ${store} earlier today and was genuinely pleased with my purchase. ${tagNote || 'Everything was neatly arranged and the team was easy to talk to.'} Happy to recommend this place.`,
        `Had a lovely visit to ${store}. ${tagNote || 'Good collection, fair pricing, and quick assistance from the staff.'} Easily my go-to spot in the area now.`,
        `Really glad I walked into ${store} for shopping. ${tagNote || 'The items feel durable and the service was polite throughout.'} Would gladly visit again with family.`,
      ],
      4: [
        `Had a good experience shopping at ${store}. ${tagNote || 'Nice selection to browse through and the staff helped me compare options.'} Worth dropping by if you are nearby.`,
        `Picked up a few things from ${store} and I am satisfied with the visit. ${tagNote || 'Decent variety and sensible pricing overall.'} Would visit again next time I need something.`,
        `Stopped in at ${store} over the weekend. ${tagNote || 'The place is well organized and the people working there are courteous.'} A solid local spot to shop.`,
      ],
    },
    hinglish: {
      5: [
        `Recently ${store} visit kiya aur experience bahut accha raha. ${tagNote || 'Jo chahiye tha aasani se mil gaya aur billing bhi fast thi.'} Next time zaroor phir aunga.`,
        `${store} par shopping karke kaafi accha laga. ${tagNote || 'Collection badiya hai aur staff ne aram se sab dikhaya.'} Aas-paas ke logon ko zaroor recommend karunga.`,
        `Aaj ${store} gaya tha aur kaafi satisfied feel hua. ${tagNote || 'Saman ki quality aur rates dono hi badhiya lage.'} Family ke saath dobara visit karunga.`,
        `Bohot accha local store hai ${store}. ${tagNote || 'Store clean hai aur har cheez dhang se rakhi hui hai.'} Zaroor try karein.`,
      ],
      4: [
        `${store} par accha experience raha. ${tagNote || 'Options kaafi mil gaye aur staff ka behaviour bhi accha tha.'} Dobara aana pasand karunga.`,
        `Kuch saman lene ${store} gaya tha aur overall shopping smooth rahi. ${tagNote || 'Variety theek hai aur prices bhi sahi lage.'} Accha store hai.`,
        `Weekend par ${store} visit kiya. ${tagNote || 'Dukan neat thi aur jo chahiye tha time par mil gaya.'} Worth a visit hai.`,
      ],
    },
  };

  const langBucket = templates[language] || templates.english;
  const ratingBucket = langBucket[rating] || langBucket[5];
  const chosen = ratingBucket[Math.abs(index) % ratingBucket.length];
  return chosen.replace(/\s+/g, ' ').trim();
}
