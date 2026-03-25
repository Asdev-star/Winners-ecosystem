// prisma/seeds/suppliers.ts
// Seed test suppliers and products for dropshipping
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'default';

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-printful' },
      update: {},
      create: {
        id: 'supplier-printful',
        tenantId,
        name: 'Printful',
        origin: 'USA · International',
        website: 'https://printful.com',
        contactEmail: 'dropship@printful.com',
        rating: 4.8,
        isVerified: true
      }
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-gelato' },
      update: {},
      create: {
        id: 'supplier-gelato',
        tenantId,
        name: 'Gelato',
        origin: 'UK · International',
        website: 'https://gelato.com',
        contactEmail: 'partners@gelato.com',
        rating: 4.6,
        isVerified: true
      }
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-kenya-crafts' },
      update: {},
      create: {
        id: 'supplier-kenya-crafts',
        tenantId,
        name: 'Kenya Crafts Co',
        origin: 'Kenya · Local',
        website: 'https://kenyacrafts.co.ke',
        contactEmail: 'orders@kenyacrafts.co.ke',
        rating: 4.9,
        isVerified: true
      }
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-nigeria-fashion' },
      update: {},
      create: {
        id: 'supplier-nigeria-fashion',
        tenantId,
        name: 'Nigeria Fashion Hub',
        origin: 'Nigeria · Local',
        website: 'https://nigeriamode.com',
        contactEmail: 'dropship@nigeriamode.com',
        rating: 4.7,
        isVerified: true
      }
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-aliexpress' },
      update: {},
      create: {
        id: 'supplier-aliexpress',
        tenantId,
        name: 'AliExpress',
        origin: 'China · International',
        website: 'https://aliexpress.com',
        contactEmail: 'support@aliexpress.com',
        rating: 4.2,
        isVerified: false
      }
    })
  ]);

  console.log('Created suppliers:', suppliers.length);

  // Create supplier products
  const products = [
    // Printful - Apparel
    {
      id: 'sp-001', supplierId: 'supplier-printful', title: 'African Print Hoodie',
      description: 'Premium cotton hoodie with bold African geometric print. Unisex sizing.',
      costPrice: 24.99, suggestedRetail: 49.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
      shippingTime: '5-7 days', atlasScore: 85, atlasReason: 'High demand in diaspora market',
      tags: ['african', 'hoodie', 'print', 'cotton', 'unisex']
    },
    {
      id: 'sp-002', supplierId: 'supplier-printful', title: 'Afro Art T-Shirt',
      description: 'Soft cotton tee featuring Afro-centric art design. Multiple colors.',
      costPrice: 14.99, suggestedRetail: 29.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      shippingTime: '5-7 days', atlasScore: 78, atlasReason: 'Consistent seller, good margin',
      tags: ['african', 't-shirt', 'art', 'cotton']
    },
    // Gelato - Prints
    {
      id: 'sp-003', supplierId: 'supplier-gelato', title: 'Mandala Wall Art',
      description: 'Premium canvas print of intricate mandala design. Multiple sizes.',
      costPrice: 18.99, suggestedRetail: 39.99, category: 'Home Decor',
      images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'],
      shippingTime: '3-5 days', atlasScore: 72, atlasReason: 'Popular in home decor niche',
      tags: ['mandala', 'wall-art', 'canvas', 'home']
    },
    {
      id: 'sp-004', supplierId: 'supplier-gelato', title: 'African Map Poster',
      description: 'Modern print of African continent with vibrant colors.',
      costPrice: 12.99, suggestedRetail: 24.99, category: 'Home Decor',
      images: ['https://images.unsplash.com/photo-1579313800699-0317e7e4519d?w=400'],
      shippingTime: '3-5 days', atlasScore: 88, atlasReason: 'Top seller for diaspora customers',
      tags: ['africa', 'map', 'poster', 'wall-art']
    },
    // Kenya Crafts - Local
    {
      id: 'sp-005', supplierId: 'supplier-kenya-crafts', title: 'Kikuyu Beaded Bracelet',
      description: 'Handcrafted authentic Kenyan bracelet with traditional beads.',
      costPrice: 8.99, suggestedRetail: 22.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400'],
      shippingTime: '2-3 days', atlasScore: 92, atlasReason: 'Authentic Kenyan product, fast shipping',
      tags: ['kenya', 'beads', 'bracelet', 'handmade', 'authentic']
    },
    {
      id: 'sp-006', supplierId: 'supplier-kenya-crafts', title: 'Maasai Shuka Cloth',
      description: 'Traditional Maasai shuka blanket. Multiple color options.',
      costPrice: 25.99, suggestedRetail: 59.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400'],
      shippingTime: '2-3 days', atlasScore: 90, atlasReason: 'Cultural authenticity, high value',
      tags: ['maasai', 'shuka', 'blanket', 'kenya', 'cultural']
    },
    // Nigeria Fashion
    {
      id: 'sp-007', supplierId: 'supplier-nigeria-fashion', title: 'Ankara Dress',
      description: 'Vibrant Ankara print dress. Ready-to-wear.',
      costPrice: 32.99, suggestedRetail: 79.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'],
      shippingTime: '3-4 days', atlasScore: 89, atlasReason: 'High demand for Nigerian events',
      tags: ['ankara', 'dress', 'nigerian', 'african-print']
    },
    {
      id: 'sp-008', supplierId: 'supplier-nigeria-fashion', title: 'Gele Headwrap',
      description: 'Premium gele headwrap for special occasions.',
      costPrice: 15.99, suggestedRetail: 35.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400'],
      shippingTime: '3-4 days', atlasScore: 82, atlasReason: 'Complements dress sales',
      tags: ['gele', 'headwrap', 'nigerian', 'accessory']
    },
    // AliExpress - Budget
    {
      id: 'sp-009', supplierId: 'supplier-aliexpress', title: 'Phone Case - Afro Pattern',
      description: 'Flexible phone case with Afro-inspired pattern. All sizes.',
      costPrice: 3.99, suggestedRetail: 12.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'],
      shippingTime: '15-20 days', atlasScore: 55, atlasReason: 'Budget option, lower margin',
      tags: ['phone-case', 'african', 'pattern', 'budget']
    },
    {
      id: 'sp-010', supplierId: 'supplier-aliexpress', title: 'Wireless Earbuds',
      description: 'Basic wireless earbuds. Good for starter products.',
      costPrice: 8.99, suggestedRetail: 24.99, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'],
      shippingTime: '15-20 days', atlasScore: 60, atlasReason: 'Popular item, competitive price',
      tags: ['earbuds', 'wireless', 'electronics', 'budget']
    },
    // Additional products to reach 25 total - Printful
    {
      id: 'sp-011', supplierId: 'supplier-printful', title: 'Ankara Bucket Hat',
      description: 'Trendy bucket hat with bold Ankara print. Adjustable fit.',
      costPrice: 12.99, suggestedRetail: 28.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'],
      shippingTime: '5-7 days', atlasScore: 80, atlasReason: 'Trending accessory in diaspora',
      tags: ['ankara', 'hat', 'bucket', 'fashion', 'accessory']
    },
    {
      id: 'sp-012', supplierId: 'supplier-printful', title: 'Kente Tote Bag',
      description: 'Canvas tote bag featuring Kente cloth pattern. Large capacity.',
      costPrice: 16.99, suggestedRetail: 34.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400'],
      shippingTime: '5-7 days', atlasScore: 84, atlasReason: 'Practical + cultural appeal',
      tags: ['kente', 'tote', 'bag', 'canvas', 'african']
    },
    // Gelato - More Home Decor
    {
      id: 'sp-013', supplierId: 'supplier-gelato', title: 'African Tribe Canvas Set',
      description: 'Set of 3 canvas prints featuring African tribal artwork.',
      costPrice: 34.99, suggestedRetail: 79.99, category: 'Home Decor',
      images: ['https://images.unsplash.com/photo-1534349762230-e0cadf2330c2?w=400'],
      shippingTime: '3-5 days', atlasScore: 75, atlasReason: 'Complete wall decor solution',
      tags: ['tribal', 'canvas', 'set', 'home', 'art']
    },
    {
      id: 'sp-014', supplierId: 'supplier-gelato', title: 'Word Art Poster - Afro',
      description: 'Motivational poster with Afro-centric typography design.',
      costPrice: 9.99, suggestedRetail: 19.99, category: 'Home Decor',
      images: ['https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400'],
      shippingTime: '3-5 days', atlasScore: 68, atlasReason: 'Popular in offices + homes',
      tags: ['word-art', 'poster', 'motivation', 'afro']
    },
    // Kenya Crafts - More Accessories
    {
      id: 'sp-015', supplierId: 'supplier-kenya-crafts', title: 'Kikuyu Beaded Necklace',
      description: 'Handcrafted beaded necklace with traditional Kikuyu patterns.',
      costPrice: 18.99, suggestedRetail: 42.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'],
      shippingTime: '2-3 days', atlasScore: 88, atlasReason: 'Authentic Kenyan craftsmanship',
      tags: ['kikuyu', 'necklace', 'beads', 'handmade', 'kenya']
    },
    {
      id: 'sp-016', supplierId: 'supplier-kenya-crafts', title: 'Maasai Earrings Set',
      description: 'Set of 3 pairs of Maasai beaded earrings. Various colors.',
      costPrice: 14.99, suggestedRetail: 32.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'],
      shippingTime: '2-3 days', atlasScore: 86, atlasReason: 'Popular gift item, good margin',
      tags: ['maasai', 'earrings', 'beads', 'set', 'kenya']
    },
    // Nigeria Fashion
    {
      id: 'sp-017', supplierId: 'supplier-nigeria-fashion', title: 'Aso Oke Scarf',
      description: 'Premium Aso Oke fabric scarf. Multiple uses.',
      costPrice: 19.99, suggestedRetail: 44.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400'],
      shippingTime: '3-4 days', atlasScore: 81, atlasReason: 'Versatile, year-round seller',
      tags: ['aso-oke', 'scarf', 'nigerian', 'fabric']
    },
    {
      id: 'sp-018', supplierId: 'supplier-nigeria-fashion', title: 'Agbada Mens Shirt',
      description: 'Traditional Agbada embroidered shirt for special occasions.',
      costPrice: 45.99, suggestedRetail: 99.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'],
      shippingTime: '3-4 days', atlasScore: 87, atlasReason: 'High-value item for events',
      tags: ['agbada', 'shirt', 'nigerian', 'traditional', 'formal']
    },
    // AliExpress - More Electronics & Accessories
    {
      id: 'sp-019', supplierId: 'supplier-aliexpress', title: 'Smart Watch - Minimal',
      description: 'Basic fitness tracker watch. Step counter + heart rate.',
      costPrice: 15.99, suggestedRetail: 39.99, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
      shippingTime: '15-20 days', atlasScore: 62, atlasReason: 'Growing tech accessory market',
      tags: ['smart-watch', 'fitness', 'tracker', 'electronics']
    },
    {
      id: 'sp-020', supplierId: 'supplier-aliexpress', title: 'Afro Mask Wall Decor',
      description: 'Decorative African mask for wall hanging.',
      costPrice: 11.99, suggestedRetail: 26.99, category: 'Home Decor',
      images: ['https://images.unsplash.com/photo-1598367772323-38ae8c2c01e6?w=400'],
      shippingTime: '15-20 days', atlasScore: 58, atlasReason: 'Budget wall art option',
      tags: ['mask', 'african', 'wall-decor', 'budget']
    },
    {
      id: 'sp-021', supplierId: 'supplier-aliexpress', title: 'Copper Earrings - Tribal',
      description: 'Geometric tribal pattern copper earrings.',
      costPrice: 4.99, suggestedRetail: 14.99, category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400'],
      shippingTime: '15-20 days', atlasScore: 52, atlasReason: 'Low-cost entry point',
      tags: ['copper', 'earrings', 'tribal', 'geometric']
    },
    // Printful - Health & Beauty
    {
      id: 'sp-022', supplierId: 'supplier-printful', title: 'Yoga Mat - African Pattern',
      description: 'Premium yoga mat with bold African geometric print.',
      costPrice: 22.99, suggestedRetail: 45.99, category: 'Health & Beauty',
      images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400'],
      shippingTime: '5-7 days', atlasScore: 76, atlasReason: 'Wellness market growing',
      tags: ['yoga', 'mat', 'fitness', 'african', 'wellness']
    },
    // Gelato - Business
    {
      id: 'sp-023', supplierId: 'supplier-gelato', title: 'Business Card - Gold Foil',
      description: 'Premium business cards with gold foil accents.',
      costPrice: 24.99, suggestedRetail: 49.99, category: 'Business',
      images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400'],
      shippingTime: '3-5 days', atlasScore: 70, atlasReason: 'Professional branding',
      tags: ['business-card', 'gold-foil', 'professional', 'branding']
    },
    // Kenya Crafts - Food
    {
      id: 'sp-024', supplierId: 'supplier-kenya-crafts', title: 'Suya Spice Set',
      description: 'Traditional Nigerian suya spice set. 3 varieties.',
      costPrice: 12.99, suggestedRetail: 28.99, category: 'Food & Agriculture',
      images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400'],
      shippingTime: '2-3 days', atlasScore: 83, atlasReason: 'Authentic African ingredients',
      tags: ['suya', 'spice', 'nigerian', 'food', 'authentic']
    },
    // Nigeria Fashion - Kids
    {
      id: 'sp-025', supplierId: 'supplier-nigeria-fashion', title: 'Kids Ankara Dress',
      description: 'Adorable Ankara print dress for girls. Ages 3-10.',
      costPrice: 18.99, suggestedRetail: 38.99, category: 'Fashion',
      images: ['https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=400'],
      shippingTime: '3-4 days', atlasScore: 79, atlasReason: 'Family market, repeat buyers',
      tags: ['kids', 'dress', 'ankara', 'african', 'children']
    }
  ];

  for (const p of products) {
    await prisma.supplierProduct.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, tenantId, ...p }
    });
  }

  console.log('Created supplier products:', products.length);
  console.log('Dropshipping seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
