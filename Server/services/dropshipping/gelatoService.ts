import { syncSupplierCatalog } from "../supplierService.js";

export async function syncGelatoCatalogForTenant(tenantId: string, limit = 24) {
  return syncSupplierCatalog({
    tenantId,
    supplier: "gelato",
    limit,
  });
}
