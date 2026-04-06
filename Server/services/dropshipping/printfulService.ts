import { importProductFromPrintful, syncSupplierCatalog } from "../supplierService.js";

export async function syncPrintfulCatalogForTenant(tenantId: string, limit = 24) {
  return syncSupplierCatalog({
    tenantId,
    supplier: "printful",
    limit,
  });
}

export async function importPrintfulProductForTenant(productId: string, tenantId: string) {
  return importProductFromPrintful(productId, tenantId);
}
