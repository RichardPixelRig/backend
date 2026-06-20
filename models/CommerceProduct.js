import mongoose from "mongoose";

const commerceProductSchema = new mongoose.Schema(
  {
    ean: String,
    mpn: String,
    partName: String,
    partType: String,

    retailers: [
      {
        name: { type: String, enum: ["scan", "currys", "overclockers"], index: true },
        price: Number,
        buyUrl: String,
        inStock: Boolean,
        sku: String,
        productId: String,
        lastUpdated: { type: Date, default: Date.now },
      },
    ],

    bestPrice: {
      retailer: String,
      price: Number,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
commerceProductSchema.index({ ean: 1, mpn: 1 });
commerceProductSchema.index({ "retailers.name": 1 });

export default mongoose.model("CommerceProduct", commerceProductSchema);
