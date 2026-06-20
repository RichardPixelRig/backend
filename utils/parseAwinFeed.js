// Parse Awin CSV feed into standardized product objects
export function parseAwinCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const product = {};
    headers.forEach((header, idx) => {
      const value = values[idx]?.trim() || "";

      // Map Awin column names to our standard fields
      if (header.includes("ean") || header.includes("gtin")) product.ean = value;
      else if (header.includes("mpn")) product.mpn = value;
      else if (header.includes("product_name") || header.includes("name")) product.name = value;
      else if (header.includes("price") || header.includes("buy_price")) {
        product.price = parseFloat(value) || null;
      } else if (header.includes("url") || header.includes("product_url")) product.buyUrl = value;
      else if (header.includes("stock") || header.includes("in_stock")) {
        product.inStock = value.toLowerCase() === "yes" || value === "1" || value.toLowerCase() === "true";
      } else if (header.includes("sku")) product.sku = value;
      else if (header.includes("product_id") || header.includes("id")) product.productId = value;
    });

    if (product.ean || product.mpn) {
      products.push(product);
    }
  }

  return products;
}

// Parse CSV line respecting quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Validate Awin feed has required columns
export function validateAwinCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { valid: false, error: "CSV is empty" };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const hasEanOrMpn = headers.some((h) => h.includes("ean") || h.includes("mpn") || h.includes("gtin"));
  const hasPrice = headers.some((h) => h.includes("price"));
  const hasUrl = headers.some((h) => h.includes("url"));
  const hasName = headers.some((h) => h.includes("name"));

  if (!hasEanOrMpn) {
    return { valid: false, error: "Missing EAN/MPN column" };
  }
  if (!hasPrice) {
    return { valid: false, error: "Missing price column" };
  }
  if (!hasUrl) {
    return { valid: false, error: "Missing product URL column" };
  }

  return { valid: true, rowCount: lines.length - 1 };
}
