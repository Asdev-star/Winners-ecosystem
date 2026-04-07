import React, { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { Link } from "react-router-dom";

interface MarketingService {
  id: string;
  title: string;
  description: string;
  category: string;
  pricing: any;
  deliverables: any;
  turnaround: string;
  vendor: {
    id: string;
    name: string;
    logoUrl?: string;
    rating?: number;
  };
}

const MarketingHubPage: React.FC = () => {
  const { user } = useAuthStore();
  const [services, setServices] = useState<MarketingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    "social-media",
    "content-creation",
    "seo",
    "paid-ads",
    "email-marketing",
    "branding",
  ];

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/v1/marketing/services", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const filteredServices =
          selectedCategory === "all"
            ? data
            : data.filter(
                (service: MarketingService) =>
                  service.category === selectedCategory,
              );
        setServices(filteredServices);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = () => {
    const plan = user?.plan || "FREE";
    switch (plan) {
      case "ENTERPRISE":
        return {
          canAccessAll: true,
          maxServices: 50,
          features: [
            "All marketing services",
            "Priority support",
            "Custom strategies",
            "White-label options",
          ],
        };
      case "PRO":
        return {
          canAccessAll: true,
          maxServices: 20,
          features: [
            "All marketing services",
            "Advanced analytics",
            "Team collaboration",
          ],
        };
      case "FREE":
      default:
        return {
          canAccessAll: false,
          maxServices: 3,
          features: [
            "Basic social media",
            "Content calendar",
            "Ad copy generator",
          ],
        };
    }
  };

  const planFeatures = getPlanFeatures();

  if (loading) {
    return (
      <div className="marketing-hub-page">
        <div className="loading">Loading marketing services...</div>
      </div>
    );
  }

  return (
    <div className="marketing-hub-page">
      <div className="marketing-header">
        <h1>🎯 Digital Marketing Hub</h1>
        <p>Connect with expert marketers and agencies to grow your business</p>

        <div className="plan-badge">
          <span className={`plan-${user?.plan?.toLowerCase() || "free"}`}>
            {user?.plan || "FREE"} Plan
          </span>
          <span className="plan-limits">
            {services.length}/{planFeatures.maxServices} services used
          </span>
        </div>
      </div>

      <div className="marketing-navigation">
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === "all"
                ? "All Services"
                : category.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <Link to="/marketing/agency-profile" className="btn-secondary">
            Become a Vendor
          </Link>
          <Link to="/marketing/dashboard" className="btn-primary">
            My Orders
          </Link>
        </div>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <div className="vendor-info">
                <img
                  src={service.vendor.logoUrl || "/default-avatar.png"}
                  alt={service.vendor.name}
                  className="vendor-avatar"
                />
                <div>
                  <h3>{service.vendor.name}</h3>
                  {service.vendor.rating && (
                    <div className="rating">
                      ⭐ {service.vendor.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              <span className="category-tag">{service.category}</span>
            </div>

            <div className="service-content">
              <h4>{service.title}</h4>
              <p>{service.description}</p>

              <div className="service-details">
                <div className="detail-item">
                  <span className="label">Turnaround:</span>
                  <span className="value">{service.turnaround}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Starting at:</span>
                  <span className="value">
                    $
                    {service.pricing?.base ||
                      service.pricing?.starting ||
                      "Contact for pricing"}
                  </span>
                </div>
              </div>
            </div>

            <div className="service-actions">
              <Link
                to={`/marketing/services/${service.id}`}
                className="btn-outline"
              >
                View Details
              </Link>
              <button className="btn-primary">Order Now</button>
            </div>
          </div>
        ))}
      </div>

      {!planFeatures.canAccessAll && (
        <div className="upgrade-prompt">
          <h3>Unlock More Marketing Power</h3>
          <p>
            Upgrade to Pro or Enterprise to access all marketing services and
            features.
          </p>
          <Link to="/billing" className="btn-primary">
            Upgrade Plan
          </Link>
        </div>
      )}

      <style>{`
        .marketing-hub-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .marketing-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .marketing-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .plan-badge {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .plan-free {
          background: gray;
          color: white;
        }
        .plan-pro {
          background: var(--gold);
          color: black;
        }
        .plan-enterprise {
          background: var(--purple);
          color: white;
        }

        .marketing-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .category-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .category-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          background: white;
          border-radius: 20px;
          cursor: pointer;
        }

        .category-btn.active {
          background: var(--primary);
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .service-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
          transition: box-shadow 0.2s;
        }

        .service-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .vendor-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .vendor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .category-tag {
          background: var(--light-bg);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .service-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .service-content p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .service-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .detail-item {
          text-align: center;
        }

        .detail-item .label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .detail-item .value {
          font-weight: 600;
        }

        .service-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-outline,
        .btn-primary,
        .btn-secondary {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          text-align: center;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-outline {
          border: 1px solid var(--primary);
          color: var(--primary);
          background: white;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
        }

        .btn-secondary {
          background: var(--secondary);
          color: white;
          border: none;
        }

        .upgrade-prompt {
          text-align: center;
          padding: 2rem;
          background: linear-gradient(135deg, var(--gold), var(--purple));
          border-radius: 12px;
          color: white;
          margin-top: 2rem;
        }

        .upgrade-prompt h3 {
          margin: 0 0 0.5rem 0;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default MarketingHubPage;
