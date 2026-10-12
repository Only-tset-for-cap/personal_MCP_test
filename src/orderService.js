const VALID_STATUSES = Object.freeze([
  "PENDING",
  "PAID",
  "SHIPPED",
  "CANCELLED",
]);

const STATUS_TRANSITIONS = Object.freeze({
  PENDING: new Set(["PAID", "CANCELLED"]),
  PAID: new Set(["SHIPPED", "CANCELLED"]),
  SHIPPED: new Set(),
  CANCELLED: new Set(),
});

export class OrderValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "OrderValidationError";
    this.details = details;
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new OrderValidationError(`${fieldName} must be a non-empty string`, {
      field: fieldName,
    });
  }
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new OrderValidationError(`${fieldName} must be a positive integer`, {
      field: fieldName,
    });
  }
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates an order without mutating the caller-provided items.
 * Prices are expressed in the order currency's major unit (for example, USD).
 */
export function calculateOrder({ items, discountPercent = 0, taxRate = 0 }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError("items must contain at least one product", {
      field: "items",
    });
  }

  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new OrderValidationError("discountPercent must be between 0 and 100", {
      field: "discountPercent",
    });
  }

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new OrderValidationError("taxRate must be between 0 and 1", {
      field: "taxRate",
    });
  }

  const normalizedItems = items.map((item, index) => {
    if (item === null || typeof item !== "object") {
      throw new OrderValidationError(`items[${index}] must be an object`, {
        field: `items[${index}]`,
      });
    }

    assertNonEmptyString(item.sku, `items[${index}].sku`);
    assertPositiveInteger(item.quantity, `items[${index}].quantity`);

    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new OrderValidationError(
        `items[${index}].unitPrice must be a non-negative number`,
        { field: `items[${index}].unitPrice` },
      );
    }

    const lineTotal = roundCurrency(item.quantity * item.unitPrice);
    return Object.freeze({
      sku: item.sku.trim(),
      quantity: item.quantity,
      unitPrice: roundCurrency(item.unitPrice),
      lineTotal,
    });
  });

  const subtotal = roundCurrency(
    normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const discount = roundCurrency(subtotal * (discountPercent / 100));
  const taxableAmount = roundCurrency(subtotal - discount);
  const tax = roundCurrency(taxableAmount * taxRate);

  return Object.freeze({
    items: Object.freeze(normalizedItems),
    subtotal,
    discount,
    tax,
    total: roundCurrency(taxableAmount + tax),
  });
}

/**
 * Reserves inventory atomically: validation happens before any stock is changed.
 */
export function reserveInventory(items, inventory) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError("items must contain at least one product", {
      field: "items",
    });
  }
  if (!(inventory instanceof Map)) {
    throw new OrderValidationError("inventory must be a Map", { field: "inventory" });
  }

  const requestedBySku = new Map();
  for (const [index, item] of items.entries()) {
    assertNonEmptyString(item?.sku, `items[${index}].sku`);
    assertPositiveInteger(item?.quantity, `items[${index}].quantity`);
    const sku = item.sku.trim();
    requestedBySku.set(sku, (requestedBySku.get(sku) ?? 0) + item.quantity);
  }

  for (const [sku, requested] of requestedBySku) {
    const available = inventory.get(sku) ?? 0;
    if (!Number.isSafeInteger(available) || available < requested) {
      throw new OrderValidationError(`insufficient inventory for ${sku}`, {
        sku,
        requested,
        available,
      });
    }
  }

  for (const [sku, requested] of requestedBySku) {
    inventory.set(sku, inventory.get(sku) - requested);
  }

  return new Map(inventory);
}

export function transitionOrder(order, nextStatus, now = new Date()) {
  if (order === null || typeof order !== "object") {
    throw new OrderValidationError("order must be an object", { field: "order" });
  }
  if (!VALID_STATUSES.includes(order.status)) {
    throw new OrderValidationError(`unknown current status: ${order.status}`, {
      field: "order.status",
    });
  }
  if (!VALID_STATUSES.includes(nextStatus)) {
    throw new OrderValidationError(`unknown next status: ${nextStatus}`, {
      field: "nextStatus",
    });
  }
  if (!STATUS_TRANSITIONS[order.status].has(nextStatus)) {
    throw new OrderValidationError(
      `cannot transition order from ${order.status} to ${nextStatus}`,
      { currentStatus: order.status, nextStatus },
    );
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new OrderValidationError("now must be a valid Date", { field: "now" });
  }

  return Object.freeze({
    ...order,
    status: nextStatus,
    updatedAt: now.toISOString(),
  });
}
