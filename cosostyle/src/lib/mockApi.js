// mockApi.js - Comprehensive database layer with state persistence

// Local assets for t-shirts from Home page
const BLANK_IMGS = [
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00428.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00425.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00428 - Copy.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00430.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00432.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00434.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00438.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 1/05-05-2025 christian00440.jpg"
];

const LOGO_IMGS = [
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00445.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00444.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00445 - Copy.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00449.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00450.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00452.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00456.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 2/05-05-2025 christian00462.jpg"
];

const SHADOW_IMGS = [
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00466.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00463.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00466 - Copy.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00468.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00470.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00474.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00475.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 3/05-05-2025 christian00479.jpg"
];

const VINTAGE_IMGS = [
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00482.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00480.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00484.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00486.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00488.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00490.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00492.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 4/05-05-2025 christian00494.jpg"
];

const EARTH_IMGS = [
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00498.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00496.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00500.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00502.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00504.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00506.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00508.jpg",
  "https://api.cosostyle.com/uploads/products/tshirt 5/05-05-2025 christian00510.jpg"
];

export const PRODUCTS = [
  {
    id: 1,
    title: 'BLANK CANVAS // DROP 01',
    price: 45.00,
    category: 'classic',
    gender: 'unisex',
    tag: 'NEW',
    image: BLANK_IMGS[0],
    images: BLANK_IMGS,
    color: 'White',
    colors: [
      { name: 'Pure White', value: '#FFFFFF', class: 'bg-white border-neutral-300' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Engineered with premium combed ringspun 240 GSM cotton. Features reinforced shoulder taping, a dense crew collar, and an exquisite drop profile that preserves structure across infinite wear cycles.',
    specs: [
      '100% long-staple combed ringspun cotton',
      'Heavyweight 240 GSM double-knit jersey',
      'Thick 1.25" rib collar band detailing',
      'Pre-shrunk to minimize laundry shrinkage',
      'Handcrafted in limited runs'
    ],
    rating: 4.8,
    reviewsCount: 18,
    availability: 'in-stock',
    reviews: [
      { id: 101, user: 'Devon M.', rating: 5, date: '2026-05-12', comment: 'The structure of this tee is incredible. Genuinely sits perfectly on the shoulders.', likes: 12, helpful: true },
      { id: 102, user: 'Sasha R.', rating: 4, date: '2026-05-28', comment: 'Really thick cotton, heavy but breathable. Definitely runs oversized.', likes: 4, helpful: false }
    ]
  },
  {
    id: 2,
    title: 'STUDIO LOGO FORM // DROP 01',
    price: 48.00,
    category: 'graphic',
    gender: 'unisex',
    tag: 'BESTSELLER',
    image: LOGO_IMGS[0],
    images: LOGO_IMGS,
    color: 'White',
    colors: [
      { name: 'Pure White', value: '#FFFFFF', class: 'bg-white border-neutral-300' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Embellished with high-density central core brand chest signature work. Tailored from bespoke 240 GSM pre-shrunk cotton, delivering an uncompromising box structured fit that holds its mold.',
    specs: [
      '100% combed ringspun cotton',
      'Heavyweight 240 GSM jersey drape fabric',
      'Bespoke center chest high-density branding print',
      'Reinforced shoulder-to-shoulder tape seams',
      'Made in limited edition series'
    ],
    rating: 4.9,
    reviewsCount: 32,
    availability: 'in-stock',
    reviews: [
      { id: 201, user: 'Tyler K.', rating: 5, date: '2026-06-02', comment: 'The logo execution is pristine. High quality tactile feel.', likes: 19, helpful: true },
      { id: 202, user: 'Jamie L.', rating: 5, date: '2026-06-15', comment: 'Best graphic tee I own. The fit holds up perfectly after 5 washes.', likes: 8, helpful: true }
    ]
  },
  {
    id: 3,
    title: '01 SHADOW PROFILE TEE',
    price: 45.00,
    category: 'oversized',
    gender: 'unisex',
    tag: 'NEW',
    image: SHADOW_IMGS[0],
    images: SHADOW_IMGS,
    color: 'Black',
    colors: [
      { name: 'Onyx Black', value: '#0A0A0A', class: 'bg-black border-neutral-800' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'The definitive dark architecture piece. Meticulously built from deep-dyed onyx 240 GSM heavy combed ringspun cotton thread, giving a structured contour drop drape designed to stay sleek forever.',
    specs: [
      '100% premium combed ringspun cotton',
      'Reactive dyed for deep, rich onyx tones',
      'Dense 240 GSM heavy structure drape',
      'Double needle side seam hems',
      'Studio exclusive design series'
    ],
    rating: 4.7,
    reviewsCount: 24,
    availability: 'in-stock',
    reviews: [
      { id: 301, user: 'Marcus G.', rating: 5, date: '2026-06-20', comment: 'Truly deep black, doesn\'t fade into gray. Drape is very clean.', likes: 14, helpful: true }
    ]
  },
  {
    id: 4,
    title: 'VINTAGE HEAVY CROP // SUN WASHED',
    price: 52.00,
    category: 'oversized',
    gender: 'unisex',
    tag: 'LIMITED',
    image: VINTAGE_IMGS[0],
    images: VINTAGE_IMGS,
    color: 'Charcoal',
    colors: [
      { name: 'Sun Washed Charcoal', value: '#3A3A3C', class: 'bg-[#3A3A3C] border-neutral-700' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Sun-faded perfection. This retro architecture aesthetic drop cuts slightly shorter for the ultimate high-waist box fit drape. Heavy enzyme-washed for a natural broken-in premium handle.',
    specs: [
      '100% heavyweight cotton knit',
      'Unique enzyme distressed wash aesthetic',
      'Shortened boxy crop structure silhouette',
      'Heavyweight collar band ribs',
      'Pigment dyed - each piece is unique'
    ],
    rating: 4.6,
    reviewsCount: 15,
    availability: 'low-stock',
    reviews: [
      { id: 401, user: 'Elena P.', rating: 4, date: '2026-06-18', comment: 'The cropped box shape is great with higher rise denim. Faded gray tone is gorgeous.', likes: 9, helpful: true }
    ]
  },
  {
    id: 5,
    title: 'BOX EARTH MINIMALIST',
    price: 46.00,
    category: 'classic',
    gender: 'unisex',
    tag: 'ESSENTIAL',
    image: EARTH_IMGS[0],
    images: EARTH_IMGS,
    color: 'Olive',
    colors: [
      { name: 'Olive Clay', value: '#555D50', class: 'bg-[#555D50] border-neutral-600' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Grounded tone minimal design structure. Custom dyed in organic olive clay hue, implementing an extended sleeve silhouette drop with an extra dense ribbed collar band detailing.',
    specs: [
      '100% combed organic ring-spun cotton',
      'Natural low-impact botanical wash coloring',
      'Drape styled extended drop sleeves',
      'Thick lay-flat coverstitched collar line',
      'Eco-conscious studio manufacturing'
    ],
    rating: 4.8,
    reviewsCount: 20,
    availability: 'in-stock',
    reviews: [
      { id: 501, user: 'Lucas V.', rating: 5, date: '2026-06-25', comment: 'The color is subtle and earthy. Collar is sturdy.', likes: 11, helpful: true }
    ]
  }
];

export const BLOG_POSTS = [
  {
    id: 1,
    title: 'THE CORE OF HEAVYWEIGHT: WHY GSM MATTERS',
    excerpt: 'Explore the architectural differences in apparel weights and how 240 GSM shapes the ultimate drape.',
    date: 'June 15, 2026',
    category: 'MATERIALS',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop',
    content: 'When we set out to build CosoStyle, we had one non-negotiable metric: weight. In modern streetwear, t-shirts have degraded into lightweight polyester blends that cling rather than drape. GSM, or Grams per Square Meter, is the metric standard for fabric density. Standard promotional tees weigh about 120-140 GSM. Mid-weight streetwear starts around 180 GSM. At CosoStyle, our 240 GSM knit offers structural support that shapes a boxy silhouette, handles multiple washes without losing form, and provides a hefty, premium feel against the skin. No polyester. No shortcut fibers. Just pure combed ringspun cotton that outlasts cycles of trend and wash.'
  },
  {
    id: 2,
    title: 'THE ART OF THE SUN-WASH: NATURAL ENZYME AGING',
    excerpt: 'A deep dive into our eco-conscious distressing treatments that create unique fades without degrading fibers.',
    date: 'June 22, 2026',
    category: 'PROCESS',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    content: 'Achieving a natural sun-faded charcoal tone requires either harsh chemicals or time. We chose a third way: organic cellulase enzyme washes. Cellulase is a natural enzyme that acts specifically on loose cotton micro-fibrils, softening the surface handle and pulling microscopic levels of dye to mimic decades of sun weathering. This process gives our VINTAGE HEAVY CROP its washed-out slate appearance and broken-in grip, while avoiding the fiber degradation associated with traditional acid washes or stone wash methodologies.'
  },
  {
    id: 3,
    title: 'STRUCTURE IN SILENCE: DESIGN DIARY',
    excerpt: 'How minimalist detailing and clean cuts redefine casual architecture.',
    date: 'July 02, 2026',
    category: 'DESIGN',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    content: 'True luxury lies in the details that you do not see. It is in the 1.25" dense collar rib that prevents bacon-neck. It is in the blind-stitched hem profiles that hide seams. It is in the shoulder-to-shoulder tape reinforcement that bears the weight of the heavy jersey. The CosoStyle studio operates on visual silence. We strip logos down, push seams to the back, and let the sheer geometry of our box cut make the statement. A clean drape is the loudest statement in a room full of noise.'
  }
];

export const FAQ_ITEMS = [
  {
    category: 'FIT & SIZING',
    questions: [
      { q: 'WHAT SIZE SHOULD I BUY?', a: 'All CosoStyle tees are tailored with an intentional boxy, oversized fit. We recommend buying your true size for the intended streetwear drape. If you prefer a more classic, standard fit, size down one.' },
      { q: 'WHAT IS GSM?', a: 'GSM stands for Grams per Square Meter. It measures fabric density. Our 240 GSM tees are double the thickness of standard high-street tees, meaning they hold structure, block wind, and drape cleanly rather than clinging.' },
      { q: 'WILL THESE TEES SHRINK IN THE WASH?', a: 'Our heavyweight cotton is pre-shrunk during the dye process. However, to maintain the optimal box silhouette, we recommend washing cold and hanging to dry.' }
    ]
  },
  {
    category: 'SHIPPING & RETURNS',
    questions: [
      { q: 'DO YOU SHIP WORLDWIDE?', a: 'Yes. We ship globally. Shipping is free for orders over $80. Standard international shipping takes 5-10 business days depending on location.' },
      { q: 'WHAT IS YOUR RETURN POLICY?', a: 'We accept returns of unworn, unwashed items in original packaging within 30 days of delivery. Returns are free in the US; international return labels carry a $10 fee deducted from refunds.' },
      { q: 'CAN I EXCHANGE FOR A DIFFERENT SIZE?', a: 'Yes. You can initiate exchanges directly from your User Dashboard within 30 days of shipment receipt.' }
    ]
  },
  {
    category: 'MATERIALS & ETHICS',
    questions: [
      { q: 'IS COSOSTYLE ENVIRONMENTALLY FRIENDLY?', a: 'Yes. We use 100% organic cotton, natural botanical washes, and ship in biodegradable cornstarch mailers. We produce in small-batch runs to eliminate inventory waste.' }
    ]
  }
];

export const MOCK_COUPONS = {
  'COSO10': 0.10, // 10% off
  'HEAVY20': 0.20, // 20% off
  'FREESHIP': 0.00 // Free shipping helper
};

// Simulated Local Storage Helpers
const getStorageItem = (key, defaultVal) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultVal;
};

const setStorageItem = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Database Initialization
const initDatabase = () => {
  if (!localStorage.getItem('coso_users')) {
    setStorageItem('coso_users', [
      {
        email: 'user@cosostyle.com',
        password: 'password123',
        name: 'Alex Coso',
        phone: '+1 (555) 123-4567',
        addresses: [
          { id: 1, type: 'Shipping', name: 'Alex Coso', street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', zip: '62704', country: 'United States', isDefault: true }
        ],
        savedPayments: [
          { id: 1, type: 'Visa', last4: '4242', exp: '12/28' }
        ]
      }
    ]);
  }
  if (!localStorage.getItem('coso_orders')) {
    setStorageItem('coso_orders', [
      {
        id: 'ORD-98721',
        date: '2026-06-14',
        items: [
          { id: 3, title: '01 SHADOW PROFILE TEE', price: 45.00, quantity: 1, size: 'L', color: 'Black', image: SHADOW_IMGS[0] }
        ],
        subtotal: 45.00,
        shipping: 10.00,
        tax: 3.60,
        discount: 0.00,
        total: 58.60,
        status: 'Delivered', // 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
        trackingNumber: '1Z999AA10123456784',
        shippingAddress: { name: 'Alex Coso', street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', zip: '62704', country: 'United States' }
      }
    ]);
  }
  if (!localStorage.getItem('coso_reviews')) {
    const defaultReviews = {};
    PRODUCTS.forEach(p => {
      defaultReviews[p.id] = p.reviews;
    });
    setStorageItem('coso_reviews', defaultReviews);
  }
};

initDatabase();

// Mock API Exported Controllers
export const mockApi = {
  // Auth API
  login: async (email, password, rememberMe = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStorageItem('coso_users', []);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          const sessionUser = { ...user };
          delete sessionUser.password;
          setStorageItem('coso_current_user', sessionUser);
          if (rememberMe) {
            localStorage.setItem('coso_remember_token', 'mock_jwt_token_coso_style');
          }
          resolve({ success: true, user: sessionUser });
        } else {
          reject(new Error('Invalid email or password credentials.'));
        }
      }, 500);
    });
  },

  register: async (name, email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStorageItem('coso_users', []);
        if (users.some(u => u.email === email)) {
          reject(new Error('Email is already registered.'));
          return;
        }
        const newUser = {
          email,
          password,
          name,
          phone: '',
          addresses: [],
          savedPayments: []
        };
        users.push(newUser);
        setStorageItem('coso_users', users);
        
        const sessionUser = { ...newUser };
        delete sessionUser.password;
        setStorageItem('coso_current_user', sessionUser);
        resolve({ success: true, user: sessionUser });
      }, 500);
    });
  },

  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem('coso_current_user');
        localStorage.removeItem('coso_remember_token');
        resolve({ success: true });
      }, 200);
    });
  },

  getCurrentUser: () => {
    return getStorageItem('coso_current_user', null);
  },

  checkRememberToken: async () => {
    return new Promise((resolve) => {
      const token = localStorage.getItem('coso_remember_token');
      const users = getStorageItem('coso_users', []);
      if (token && users.length > 0) {
        const user = { ...users[0] };
        delete user.password;
        setStorageItem('coso_current_user', user);
        resolve(user);
      } else {
        resolve(null);
      }
    });
  },

  updateProfile: async (profileData) => {
    return new Promise((resolve, reject) => {
      const currentUser = getStorageItem('coso_current_user', null);
      if (!currentUser) {
        reject(new Error('No authenticated user found.'));
        return;
      }
      const users = getStorageItem('coso_users', []);
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex === -1) {
        reject(new Error('User database sync error.'));
        return;
      }

      users[userIndex].name = profileData.name || users[userIndex].name;
      users[userIndex].phone = profileData.phone || users[userIndex].phone;
      
      const updatedSessionUser = { ...users[userIndex] };
      delete updatedSessionUser.password;
      
      setStorageItem('coso_users', users);
      setStorageItem('coso_current_user', updatedSessionUser);
      resolve(updatedSessionUser);
    });
  },

  changePassword: async (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      const currentUser = getStorageItem('coso_current_user', null);
      if (!currentUser) {
        reject(new Error('No authenticated user found.'));
        return;
      }
      const users = getStorageItem('coso_users', []);
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex === -1) {
        reject(new Error('User not found.'));
        return;
      }

      if (users[userIndex].password !== oldPassword) {
        reject(new Error('Incorrect current password.'));
        return;
      }

      users[userIndex].password = newPassword;
      setStorageItem('coso_users', users);
      resolve({ success: true });
    });
  },

  // Address API
  saveAddress: async (address) => {
    return new Promise((resolve, reject) => {
      const currentUser = getStorageItem('coso_current_user', null);
      if (!currentUser) {
        reject(new Error('Unauthorized.'));
        return;
      }
      const users = getStorageItem('coso_users', []);
      const userIdx = users.findIndex(u => u.email === currentUser.email);
      if (userIdx === -1) return;

      if (!users[userIdx].addresses) users[userIdx].addresses = [];

      if (address.isDefault) {
        users[userIdx].addresses.forEach(a => a.isDefault = false);
      }

      if (address.id) {
        // Edit
        const addrIdx = users[userIdx].addresses.findIndex(a => a.id === address.id);
        if (addrIdx !== -1) {
          users[userIdx].addresses[addrIdx] = address;
        }
      } else {
        // Create
        address.id = Date.now();
        if (users[userIdx].addresses.length === 0) address.isDefault = true;
        users[userIdx].addresses.push(address);
      }

      setStorageItem('coso_users', users);
      
      const updatedSessionUser = { ...users[userIdx] };
      delete updatedSessionUser.password;
      setStorageItem('coso_current_user', updatedSessionUser);
      resolve(updatedSessionUser.addresses);
    });
  },

  deleteAddress: async (addressId) => {
    return new Promise((resolve, reject) => {
      const currentUser = getStorageItem('coso_current_user', null);
      if (!currentUser) {
        reject(new Error('Unauthorized.'));
        return;
      }
      const users = getStorageItem('coso_users', []);
      const userIdx = users.findIndex(u => u.email === currentUser.email);
      if (userIdx === -1) return;

      users[userIdx].addresses = users[userIdx].addresses.filter(a => a.id !== addressId);
      
      // If default was deleted, set first address as default
      if (users[userIdx].addresses.length > 0 && !users[userIdx].addresses.some(a => a.isDefault)) {
        users[userIdx].addresses[0].isDefault = true;
      }

      setStorageItem('coso_users', users);

      const updatedSessionUser = { ...users[userIdx] };
      delete updatedSessionUser.password;
      setStorageItem('coso_current_user', updatedSessionUser);
      resolve(updatedSessionUser.addresses);
    });
  },

  // Orders API
  getUserOrders: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orders = getStorageItem('coso_orders', []);
        resolve(orders);
      }, 300);
    });
  },

  createOrder: async (orderData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orders = getStorageItem('coso_orders', []);
        const newOrder = {
          id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toISOString().split('T')[0],
          status: 'Placed',
          trackingNumber: `1Z${Math.random().toString(36).substring(2, 17).toUpperCase()}`,
          ...orderData
        };
        orders.unshift(newOrder);
        setStorageItem('coso_orders', orders);
        resolve(newOrder);
      }, 500);
    });
  },

  cancelOrder: async (orderId) => {
    return new Promise((resolve, reject) => {
      const orders = getStorageItem('coso_orders', []);
      const orderIdx = orders.findIndex(o => o.id === orderId);
      if (orderIdx === -1) {
        reject(new Error('Order not found.'));
        return;
      }
      if (orders[orderIdx].status !== 'Placed' && orders[orderIdx].status !== 'Processing') {
        reject(new Error('Cannot cancel orders already shipped or delivered.'));
        return;
      }
      orders[orderIdx].status = 'Cancelled';
      setStorageItem('coso_orders', orders);
      resolve(orders[orderIdx]);
    });
  },

  // Reviews API
  getProductReviews: (productId) => {
    const reviews = getStorageItem('coso_reviews', {});
    return reviews[productId] || [];
  },

  addProductReview: async (productId, review) => {
    return new Promise((resolve) => {
      const reviews = getStorageItem('coso_reviews', {});
      if (!reviews[productId]) reviews[productId] = [];
      
      const newReview = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        helpful: false,
        ...review
      };
      
      reviews[productId].unshift(newReview);
      setStorageItem('coso_reviews', reviews);
      
      // Update rating in memory/local storage if needed
      resolve(newReview);
    });
  },

  likeReview: async (productId, reviewId) => {
    return new Promise((resolve) => {
      const reviews = getStorageItem('coso_reviews', {});
      const list = reviews[productId] || [];
      const review = list.find(r => r.id === reviewId);
      if (review) {
        review.likes += 1;
        review.helpful = true;
        setStorageItem('coso_reviews', reviews);
      }
      resolve(review);
    });
  }
};
