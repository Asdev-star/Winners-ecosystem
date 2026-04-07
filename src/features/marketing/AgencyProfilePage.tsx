import React, { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

interface MarketingService {
  id: string;
  title: string;
  description: string;
  category: string;
  pricing: any;
  deliverables: any;
  turnaround: string;
  createdAt: string;
}

const AgencyProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [services, setServices] = useState<MarketingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    category: "social-media",
    pricing: { base: "", premium: "", enterprise: "" },
    deliverables: [""],
    turnaround: "3-5 days",
  });

  const categories = [
    "social-media",
    "content-creation",
    "seo",
    "paid-ads",
    "email-marketing",
    "branding",
    "web-development",
    "consulting",
  ];

  useEffect(() => {
    fetchVendorServices();
  }, []);

  const fetchVendorServices = async () => {
    try {
      // This would fetch services for the current vendor
      // For now, we'll show an empty state
      setServices([]);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/v1/marketing/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newService,
          pricing: JSON.stringify(newService.pricing),
          deliverables: JSON.stringify(
            newService.deliverables.filter((d) => d.trim()),
          ),
        }),
      });

      if (response.ok) {
        const service = await response.json();
        setServices([...services, service]);
        setNewService({
          title: "",
          description: "",
          category: "social-media",
          pricing: { base: "", premium: "", enterprise: "" },
          deliverables: [""],
          turnaround: "3-5 days",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error creating service:", error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/v1/marketing/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setServices(services.filter((s) => s.id !== serviceId));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const addDeliverable = () => {
    setNewService({
      ...newService,
      deliverables: [...newService.deliverables, ""],
    });
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...newService.deliverables];
    updated[index] = value;
    setNewService({
      ...newService,
      deliverables: updated,
    });
  };

  const removeDeliverable = (index: number) => {
    setNewService({
      ...newService,
      deliverables: newService.deliverables.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="agency-profile-page">
        <div className="loading">Loading your agency profile...</div>
      </div>
    );
  }

  return (
    <div className="agency-profile-page">
      <div className="profile-header">
        <h1>🏢 Agency Profile</h1>
        <p>Manage your marketing services and grow your agency</p>

        <div className="profile-stats">
          <div className="stat">
            <span className="number">{services.length}</span>
            <span className="label">Services</span>
          </div>
          <div className="stat">
            <span className="number">0</span>
            <span className="label">Orders</span>
          </div>
          <div className="stat">
            <span className="number">0</span>
            <span className="label">Reviews</span>
          </div>
        </div>
      </div>

      <div className="services-section">
        <div className="section-header">
          <h2>Your Services</h2>
          <button
            className="btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "+ Add Service"}
          </button>
        </div>

        {isEditing && (
          <form className="service-form" onSubmit={handleCreateService}>
            <div className="form-group">
              <label>Service Title</label>
              <input
                type="text"
                value={newService.title}
                onChange={(e) =>
                  setNewService({ ...newService, title: e.target.value })
                }
                required
                placeholder="e.g., Social Media Management"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newService.description}
                onChange={(e) =>
                  setNewService({ ...newService, description: e.target.value })
                }
                required
                placeholder="Describe what you offer..."
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newService.category}
                  onChange={(e) =>
                    setNewService({ ...newService, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("-", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Turnaround Time</label>
                <input
                  type="text"
                  value={newService.turnaround}
                  onChange={(e) =>
                    setNewService({ ...newService, turnaround: e.target.value })
                  }
                  placeholder="e.g., 3-5 business days"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pricing (USD)</label>
              <div className="pricing-inputs">
                <input
                  type="number"
                  placeholder="Base price"
                  value={newService.pricing.base}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      pricing: { ...newService.pricing, base: e.target.value },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Premium price"
                  value={newService.pricing.premium}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      pricing: {
                        ...newService.pricing,
                        premium: e.target.value,
                      },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Enterprise price"
                  value={newService.pricing.enterprise}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      pricing: {
                        ...newService.pricing,
                        enterprise: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deliverables</label>
              {newService.deliverables.map((deliverable, index) => (
                <div key={index} className="deliverable-input">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => updateDeliverable(index, e.target.value)}
                    placeholder="e.g., 10 social media posts"
                  />
                  {newService.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliverable}
                className="add-deliverable-btn"
              >
                + Add Deliverable
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create Service
              </button>
            </div>
          </form>
        )}

        <div className="services-grid">
          {services.length === 0 ? (
            <div className="empty-state">
              <h3>No services yet</h3>
              <p>
                Create your first marketing service to start getting orders.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <h4>{service.title}</h4>
                  <span className="category-tag">{service.category}</span>
                </div>

                <p className="service-description">{service.description}</p>

                <div className="service-details">
                  <div className="detail">
                    <span className="label">Turnaround:</span>
                    <span className="value">{service.turnaround}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Base Price:</span>
                    <span className="value">
                      ${JSON.parse(service.pricing).base || "Contact"}
                    </span>
                  </div>
                </div>

                <div className="service-actions">
                  <button className="btn-outline">Edit</button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .agency-profile-page {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .profile-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .profile-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .profile-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
        }

        .stat {
          text-align: center;
        }

        .stat .number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
        }

        .stat .label {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .services-section {
          margin-top: 3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          margin: 0;
        }

        .service-form {
          background: var(--light-bg);
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .pricing-inputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .deliverable-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .deliverable-input input {
          flex: 1;
        }

        .remove-btn {
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .add-deliverable-btn {
          background: none;
          border: 1px dashed var(--primary);
          color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .form-actions {
          text-align: right;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .service-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .service-header h4 {
          margin: 0;
          font-size: 1.2rem;
        }

        .category-tag {
          background: var(--light-bg);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .service-description {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .service-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .detail .label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .detail .value {
          font-weight: 600;
        }

        .service-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-primary,
        .btn-outline,
        .btn-danger {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-outline {
          background: white;
          border: 1px solid var(--primary);
          color: var(--primary);
        }

        .btn-danger {
          background: var(--danger);
          color: white;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
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

export default AgencyProfilePage;
