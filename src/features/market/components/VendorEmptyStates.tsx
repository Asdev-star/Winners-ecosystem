// Phase 4: Vendor Empty States
import { Link } from 'react-router-dom';

export function NoVendorProfile({ onCreateVendor }: { onCreateVendor?: () => void }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">🏪</div>
      <h3>Start Selling on Winners Market</h3>
      <p>Create your vendor profile to start listing products.</p>
      <button className="empty-state-btn primary" onClick={onCreateVendor}>Create Vendor Profile</button>
      <Link to="/market/vendors" className="empty-state-link">Learn about selling</Link>
    </div>
  );
}

export function NoProducts({ onAddProduct, isDropshipper }: { onAddProduct?: () => void; isDropshipper?: boolean }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">📦</div>
      <h3>{isDropshipper ? 'Import Your First Product' : 'Add Your First Product'}</h3>
      <p>{isDropshipper ? 'Browse supplier catalog to import products.' : 'List products to start receiving orders.'}</p>
      <button className="empty-state-btn primary" onClick={onAddProduct}>{isDropshipper ? 'Browse Catalog' : 'Add Product'}</button>
    </div>
  );
}

export function NoOrders({ onShareStore }: { onShareStore?: () => void }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">📈</div>
      <h3>No Orders Yet</h3>
      <p>Share your store to start receiving orders.</p>
      <button className="empty-state-btn primary" onClick={onShareStore}>Share Your Store</button>
    </div>
  );
}

export default { NoVendorProfile, NoProducts, NoOrders };
