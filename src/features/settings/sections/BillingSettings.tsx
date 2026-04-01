const BILLING_SETTINGS = {
  currentPlan: { type: "display", label: "Current Plan", current: "FREE" },
  manageBilling: { type: "action", label: "Manage Subscription", desc: "Stripe Portal" },
  viewInvoices: { type: "action", label: "View Invoices" },
  cancelSubscription: { type: "danger", label: "Cancel Subscription" },
};

export default BILLING_SETTINGS;
