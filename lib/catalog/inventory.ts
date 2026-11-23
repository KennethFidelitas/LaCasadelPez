type InventoryRow = { quantity: number | null; low_stock_threshold?: number | null }

export function withInventoryStock<T extends { low_stock_threshold: number }>(
  item: T & { inventory?: InventoryRow[] | null },
): T {
  const inventory = item.inventory ?? []
  return {
    ...item,
    stock_quantity: inventory.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    low_stock_threshold: inventory.length
      ? Math.max(...inventory.map((row) => Number(row.low_stock_threshold ?? 0)))
      : Number(item.low_stock_threshold ?? 0),
  }
}
