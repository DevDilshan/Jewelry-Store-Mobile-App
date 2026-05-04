export function staffCanManageProducts(role: string) {
  return role === "admin" || role === "productmanager";
}

export function staffCanManageDiscounts(role: string) {
  return role === "admin" || role === "sales";
}

export function staffCanViewPortfolios(role: string) {
  return role === "admin" || role === "productmanager" || role === "viewer" || role === "designer";
}

export function staffCanEditPortfolios(role: string) {
  return role === "admin" || role === "productmanager";
}

/** Designers edit only their own portfolio via `/me` routes. */
export function staffIsDesigner(role: string) {
  return role === "designer";
}

export function staffCanManageTeam(role: string) {
  return role === "admin";
}

export function staffCanManageOrders(role: string) {
  return role === "admin" || role === "sales";
}

export function staffCanDeleteFeedback(role: string) {
  return role === "admin";
}

export function staffCanViewCustomDesignRequests(role: string) {
  return ["admin", "productmanager", "sales", "viewer", "designer"].includes(role);
}

export function staffCanEditCustomDesignRequests(role: string) {
  return role === "admin" || role === "productmanager" || role === "sales" || role === "designer";
}
//updated