import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOrder,
  OrderValidationError,
  reserveInventory,
  transitionOrder,
} from "../src/orderService.js";

test("calculateOrder applies a discount before tax", () => {
  const result = calculateOrder({
    items: [
      { sku: "BOOK-1", quantity: 2, unitPrice: 12.5 },
      { sku: "PEN-1", quantity: 3, unitPrice: 1.2 },
    ],
    discountPercent: 10,
    taxRate: 0.1,
  });

  assert.deepEqual(result, {
    items: [
      { sku: "BOOK-1", quantity: 2, unitPrice: 12.5, lineTotal: 25 },
      { sku: "PEN-1", quantity: 3, unitPrice: 1.2, lineTotal: 3.6 },
    ],
    subtotal: 28.6,
    discount: 2.86,
    tax: 2.57,
    total: 28.31,
  });
});

test("calculateOrder rejects invalid pricing inputs", () => {
  assert.throws(
    () => calculateOrder({ items: [{ sku: "A", quantity: 1, unitPrice: -1 }] }),
    (error) => {
      assert.equal(error instanceof OrderValidationError, true);
      assert.equal(error.details.field, "items[0].unitPrice");
      return true;
    },
  );

  assert.throws(
    () => calculateOrder({ items: [{ sku: "A", quantity: 1, unitPrice: 1 }], taxRate: 2 }),
    /taxRate must be between 0 and 1/,
  );
});

test("calculateOrder does not mutate its input", () => {
  const items = [{ sku: "  NOTEBOOK  ", quantity: 1, unitPrice: 4.999 }];
  const snapshot = structuredClone(items);

  const result = calculateOrder({ items });

  assert.deepEqual(items, snapshot);
  assert.equal(result.items[0].sku, "NOTEBOOK");
  assert.equal(result.items[0].unitPrice, 5);
});

test("reserveInventory aggregates duplicate SKUs", () => {
  const inventory = new Map([
    ["BOOK-1", 5],
    ["PEN-1", 10],
  ]);

  const updated = reserveInventory(
    [
      { sku: "BOOK-1", quantity: 2 },
      { sku: "BOOK-1", quantity: 1 },
      { sku: "PEN-1", quantity: 4 },
    ],
    inventory,
  );

  assert.deepEqual([...updated], [["BOOK-1", 2], ["PEN-1", 6]]);
  assert.deepEqual([...inventory], [["BOOK-1", 2], ["PEN-1", 6]]);
});

test("reserveInventory is atomic when stock is insufficient", () => {
  const inventory = new Map([
    ["BOOK-1", 5],
    ["PEN-1", 1],
  ]);
  const before = new Map(inventory);

  assert.throws(
    () => reserveInventory(
      [{ sku: "BOOK-1", quantity: 2 }, { sku: "PEN-1", quantity: 3 }],
      inventory,
    ),
    /insufficient inventory for PEN-1/,
  );
  assert.deepEqual(inventory, before);
});

test("transitionOrder returns a new order for an allowed transition", () => {
  const order = { id: "order-1", status: "PENDING", total: 20 };
  const paidAt = new Date("2026-10-05T01:30:00.000Z");

  const updated = transitionOrder(order, "PAID", paidAt);

  assert.deepEqual(updated, {
    id: "order-1",
    status: "PAID",
    total: 20,
    updatedAt: "2026-10-05T01:30:00.000Z",
  });
  assert.equal(order.status, "PENDING");
});

test("transitionOrder rejects terminal-state transitions", () => {
  assert.throws(
    () => transitionOrder({ id: "order-1", status: "SHIPPED" }, "CANCELLED"),
    /cannot transition order from SHIPPED to CANCELLED/,
  );
});
