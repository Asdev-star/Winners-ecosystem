// Phase 4 Layer: Winners Market
// Product Detail Page - Individual product with reviews
// Commerce Hub (4A) - Core marketplace functionality

import { useState, useEffect, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import AIInsightBanner from '../../components/ui/AIInsightBanner';
import ContextBar from '../../components/ui/ContextBar';

// CSS Variables from design system
const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px',
  },
  breadcrumb: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text-dim)',
    marginBottom: '24px',
  },
  breadcrumbLink: {
    color: 'var(--ice)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginBottom: '48px',
  },
  imageGallery: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  mainImage: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface2)',
  },
  thumbnailRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto' as const,
  },
  thumbnail: {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '2px solid var(--border)',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  thumbnailActive: {
    border: '2px solid var(--gold)',
  },
  productInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  vendorBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: 'var(--surface2)',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--text-dim)',
    width: 'fit-content',
  },
  vendorVerified: {
    color: 'var(--green)',
  },
  productTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stars: {
    display: 'flex',
    gap: '2px',
    color: 'var(--gold)',
  },
  ratingText: {
    fontSize: '14px',
    color: 'var(--text-dim)',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginTop: '8px',
  },
  price: {
    fontFamily: 'var(--font-mono)',
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--gold)',
  },
  originalPrice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    color: 'var(--text-dim)',
    textDecoration: 'line-through',
  },
  discount: {
    padding: '4px 8px',
    backgroundColor: 'var(--green)',
    color: 'var(--bg)',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '4px',
  },
  description: {
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    fontSize: '15px',
  },
  selectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  selectLabel: {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  select: {
    padding: '12px',
    backgroundColor: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  quantityBtn: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--surface2)',
    border: 'none',
    color: 'var(--text)',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    width: '48px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  btnPrimary: {
    flex: 1,
    padding: '14px 24px',
    backgroundColor: 'var(--gold)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  btnSecondary: {
    padding: '14px 24px',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  features: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
  },
  featuresTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '12px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-dim)',
  },
  section: {
    marginTop: '48px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  reviewCard: {
    padding: '20px',
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    marginBottom: '16px',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  reviewAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reviewAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--surface2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--gold)',
  },
  reviewName: {
    fontWeight: 600,
    color: 'var(--text)',
    fontSize: '14px',
  },
  reviewDate: {
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  reviewContent: {
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    fontSize: '14px',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: 'var(--text-dim)',
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
    color: 'var(--text-dim)',
  },
};

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  verified: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  vendor: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
  };
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  features: string[];
}

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) {
      setError('Product not found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data);
      if (data.variants?.length > 0) {
        setSelectedVariant(data.variants[0].id);
      }
    } catch (err) {
      // For demo, use mock data
      setProduct({
        id: productId || '1',
        name: 'Premium African Print Dashiki Shirt',
        description: 'Handcrafted authentic African dashiki shirt featuring traditional geometric patterns. Made from 100% cotton for maximum comfort and breathability. Perfect for cultural events, celebrations, or everyday wear.',
        price: 89.99,
        comparePrice: 129.99,
        images: [
          { id: '1', url: '/placeholder-product.jpg', alt: 'Front view' },
          { id: '2', url: '/placeholder-product.jpg', alt: 'Back view' },
          { id: '3', url: '/placeholder-product.jpg', alt: 'Detail view' },
        ],
        variants: [
          { id: 'v1', name: 'Small', price: 89.99, stock: 5 },
          { id: 'v2', name: 'Medium', price: 89.99, stock: 12 },
          { id: 'v3', name: 'Large', price: 89.99, stock: 8 },
          { id: 'v4', name: 'XL', price: 94.99, stock: 3 },
        ],
        vendor: {
          id: 'v1',
          name: 'AfroThreads Authentic',
          verified: true,
          rating: 4.8,
        },
        category: 'Fashion',
        tags: ['african', 'dashiki', 'cotton', 'handmade'],
        rating: 4.7,
        reviewCount: 128,
        stock: 28,
        features: [
          '100% Premium Cotton',
          'Handcrafted in Nigeria',
          'Traditional Geometric Patterns',
          'Unisex Design',
          'Machine Washable',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const response = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant,
          quantity,
        }),
      });

      if (response.ok) {
        navigate('/cart');
      }
    } catch (err) {
      // For demo, just navigate to cart
      navigate('/cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.3 }}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <span style={{ fontSize: '48px' }}>📦</span>
          <p>{error || 'Product not found'}</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/market')}>
            Back to Market
          </button>
        </div>
      </div>
    );
  }

  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div style={styles.container}>
      <ContextBar activeLayer="market" statusOverrides={{ market: "active" }} />
      <AIInsightBanner page="market" assistant="atlas" />

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={() => navigate('/market')}>
          Market
        </span>
        <span>›</span>
        <span style={styles.breadcrumbLink} onClick={() => navigate(`/market?category=${product.category}`)}>
          {product.category}
        </span>
        <span>›</span>
        <span>{product.name}</span>
      </div>

      {/* Product Grid */}
      <div style={styles.productGrid}>
        {/* Image Gallery */}
        <div style={styles.imageGallery}>
          <img
            src={product.images[selectedImage]?.url || '/placeholder.jpg'}
            alt={product.images[selectedImage]?.alt || product.name}
            style={styles.mainImage}
          />
          <div style={styles.thumbnailRow}>
            {product.images.map((img, idx) => (
              <img
                key={img.id}
                src={img.url}
                alt={img.alt}
                style={{
                  ...styles.thumbnail,
                  ...(selectedImage === idx ? styles.thumbnailActive : {}),
                }}
                onClick={() => setSelectedImage(idx)}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div style={styles.productInfo}>
          <div style={styles.vendorBadge}>
            <span>🏪</span>
            <span>{product.vendor.name}</span>
            {product.vendor.verified && (
              <span style={styles.vendorVerified}>✓</span>
            )}
          </div>

          <h1 style={styles.productTitle}>{product.name}</h1>

          <div style={styles.ratingRow}>
            <div style={styles.stars}>
              {renderStars(product.rating)}
            </div>
            <span style={styles.ratingText}>
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <div style={styles.priceRow}>
            <span style={styles.price}>${product.price.toFixed(2)}</span>
            {product.comparePrice && (
              <>
                <span style={styles.originalPrice}>${product.comparePrice.toFixed(2)}</span>
                <span style={styles.discount}>-{discount}%</span>
              </>
            )}
          </div>

          <p style={styles.description}>{product.description}</p>

          {/* Variant Selection */}
          {product.variants.length > 0 && (
            <div style={styles.selectGroup}>
              <label style={styles.selectLabel}>Size</label>
              <select
                style={styles.select}
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} {variant.stock === 0 ? '(Out of stock)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div style={styles.selectGroup}>
            <label style={styles.selectLabel}>Quantity</label>
            <div style={styles.quantityRow}>
              <div style={styles.quantityControl}>
                <button
                  style={styles.quantityBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <div style={styles.quantityValue}>{quantity}</div>
                <button
                  style={styles.quantityBtn}
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  +
                </button>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                {product.stock} in stock
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actionRow}>
            <button
              style={styles.btnPrimary}
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
            >
              {addingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button style={styles.btnSecondary}>
              ♡ Save
            </button>
          </div>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.featuresTitle}>Features</div>
            <div style={styles.featureList}>
              {product.features.map((feature, idx) => (
                <div key={idx} style={styles.feature}>
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Reviews</h2>
        
        {/* Demo reviews for display */}
        <div style={styles.reviewCard}>
          <div style={styles.reviewHeader}>
            <div style={styles.reviewAuthor}>
              <div style={styles.reviewAvatar}>JD</div>
              <div>
                <div style={styles.reviewName}>John D.</div>
                <div style={styles.reviewDate}>Verified Purchase • 2 weeks ago</div>
              </div>
            </div>
            <div style={styles.stars}>{renderStars(5)}</div>
          </div>
          <p style={styles.reviewContent}>
            Absolutely beautiful shirt! The quality is outstanding and the patterns are even more stunning in person. 
            Fits perfectly and the fabric is very comfortable. Will definitely be ordering more from this vendor.
          </p>
        </div>

        <div style={styles.reviewCard}>
          <div style={styles.reviewHeader}>
            <div style={styles.reviewAuthor}>
              <div style={styles.reviewAvatar}>SM</div>
              <div>
                <div style={styles.reviewName}>Sarah M.</div>
                <div style={styles.reviewDate}>Verified Purchase • 1 month ago</div>
              </div>
            </div>
            <div style={styles.stars}>{renderStars(4)}</div>
          </div>
          <p style={styles.reviewContent}>
            Great quality and authentic African craftsmanship. Shipping took a bit longer than expected 
            but the product was worth the wait. Would recommend!
          </p>
        </div>
      </div>
    </div>
  );
}
