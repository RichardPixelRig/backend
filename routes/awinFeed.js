import express from "express";
import CommerceProduct from "../models/CommerceProduct.js";
import { parseAwinCSV, validateAwinCSV } from "../utils/parseAwinFeed.js";

const router = express.Router();

router.post("/ingest", async (req, res) => {
  try {
    const { retailer, products, csvText } = req.body;

    // Accept either products array (JSON) or csvText (CSV string)
    let productsToIngest = products;

    if (csvText && !productsToIngest) {
      const validation = validateAwinCSV(csvText);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      productsToIngest = parseAwinCSV(csvText);
    }

    if (!retailer || !productsToIngest || !Array.isArray(productsToIngest)) {
      return res.status(400).json({
        error: "Invalid request: retailer required, and either 'products' array (JSON) or 'csvText' (CSV string)",
      });
    }

    if (!["scan", "currys", "overclockers"].includes(retailer)) {
      return res.status(400).json({ error: "Invalid retailer" });
    }

    let matched = 0;
    let unmatched = 0;

    for (const product of productsToIngest) {
      const { ean, mpn, name, price, buyUrl, inStock, sku, productId } = product;

      if (!ean && !mpn) {
        unmatched++;
        continue;
      }

      const query = {};
      if (ean) query.ean = ean;
      if (mpn) query.mpn = mpn;

      const existing = await CommerceProduct.findOne(query);

      if (existing) {
        const retailerIndex = existing.retailers.findIndex((r) => r.name === retailer);

        if (retailerIndex >= 0) {
          existing.retailers[retailerIndex] = {
            name: retailer,
            price,
            buyUrl,
            inStock: inStock !== false,
            sku,
            productId,
            lastUpdated: new Date(),
          };
        } else {
          existing.retailers.push({
            name: retailer,
            price,
            buyUrl,
            inStock: inStock !== false,
            sku,
            productId,
            lastUpdated: new Date(),
          });
        }

        existing.partName = name;
        if (price) {
          const allPrices = existing.retailers
            .filter((r) => r.price)
            .sort((a, b) => a.price - b.price);
          if (allPrices.length > 0) {
            existing.bestPrice = {
              retailer: allPrices[0].name,
              price: allPrices[0].price,
            };
          }
        }

        await existing.save();
        matched++;
      } else {
        const newProduct = new CommerceProduct({
          ean,
          mpn,
          partName: name,
          retailers: [
            {
              name: retailer,
              price,
              buyUrl,
              inStock: inStock !== false,
              sku,
              productId,
              lastUpdated: new Date(),
            },
          ],
          bestPrice: price ? { retailer, price } : null,
        });
        await newProduct.save();
        matched++;
      }
    }

    res.json({
      success: true,
      retailer,
      matched,
      unmatched,
      total: productsToIngest.length,
      message: `Ingested ${matched} products, ${unmatched} unmatched`,
    });
  } catch (err) {
    console.error("Feed ingestion error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { ean, mpn, retailer } = req.query;

    if (!ean && !mpn) {
      return res.status(400).json({ error: "EAN or MPN required" });
    }

    const query = {};
    if (ean) query.ean = ean;
    if (mpn) query.mpn = mpn;

    let product = await CommerceProduct.findOne(query);

    if (!product) {
      return res.json({ found: false, message: "Product not found" });
    }

    if (retailer) {
      product = {
        ...product.toObject(),
        retailers: product.retailers.filter((r) => r.name === retailer),
      };
    }

    res.json({ found: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all matched commerce data for frontend catalog.js
router.get("/all", async (req, res) => {
  try {
    const products = await CommerceProduct.find({});
    const commerceMap = {};

    products.forEach((p) => {
      if (p.bestPrice) {
        const retailerData = p.retailers.find((r) => r.name === p.bestPrice.retailer);
        if (retailerData) {
          commerceMap[`${p.ean}-${p.mpn}`] = {
            price: p.bestPrice.price,
            buyUrl: retailerData.buyUrl,
            inStock: retailerData.inStock,
            source: p.bestPrice.retailer,
          };
        }
      }
    });

    res.json({ success: true, count: products.length, data: commerceMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
