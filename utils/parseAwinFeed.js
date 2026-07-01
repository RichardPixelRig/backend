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
    const row = {};
    headers.forEach((header, idx) => { row[header] = values[idx]?.trim() || ""; });

    // ── Identifiers ──
    product.ean = row["ean"] || row["gtin"] || firstMatch(row, ["ean", "gtin"]) || "";
    product.mpn = row["mpn"] || row["product_model"] || firstMatch(row, ["mpn"]) || "";
    product.name = row["product_name"] || firstMatch(row, ["product_name", "name"]) || "";
    product.sku = row["merchant_product_id"] || firstMatch(row, ["sku"]) || "";
    product.productId = row["aw_product_id"] || row["merchant_product_id"] || firstMatch(row, ["product_id"]) || "";

    // ── Price: prefer the actual selling price over rrp/base ──
    const priceRaw =
      row["store_price"] || row["search_price"] || row["display_price"] ||
      row["saleprice"] || row["price"] || firstMatch(row, ["price"]) || "";
    product.price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, "")) || null;

    // ── Buy link: prefer the tracked affiliate deep link ──
    product.buyUrl =
      row["aw_deep_link"] || row["merchant_deep_link"] || row["deep_link"] ||
      row["product_url"] || firstMatch(row, ["deep_link", "url"]) || "";

    // ── Stock ──
    const stockRaw = (row["in_stock"] || row["stock"] || firstMatch(row, ["stock"]) || "").toLowerCase();
    product.inStock = stockRaw === "" ? true : (stockRaw === "yes" || stockRaw === "1" || stockRaw === "true");

    if (product.ean || product.mpn) {
      products.push(product);
    }
  }

  return products;
}

// Return the value of the first header that contains any of the given substrings.
function firstMatch(row, substrings) {
  for (const header of Object.keys(row)) {
    if (substrings.some((s) => header.includes(s)) && row[header]) return row[header];
  }
  return "";
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
  const hasEanOrMpn = headers.some((h) => h.includes("ean") || h.includes("mpn") || h.includes("gtin") || h.includes("product_model"));
  const hasPrice = headers.some((h) => h.includes("price"));
  const hasUrl = headers.some((h) => h.includes("url") || h.includes("deep_link"));

  if (!hasEanOrMpn) {
    return { valid: false, error: "Missing EAN/MPN column" };
  }
  if (!hasPrice) {
    return { valid: false, error: "Missing price column" };
  }
  if (!hasUrl) {
    return { valid: false, error: "Missing product URL / deep link column" };
  }

  return { valid: true, rowCount: lines.length - 1 };
}
