const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    // ✅ RENAMED: 'imageURL' -> 'image' to match Frontend & Cloudinary logic
    image: {
      type: String, 
      required: true, // I recommend setting this to true for a store
      default: 'https://placehold.co/600x400?text=No+Image' // Fallback image
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    // The "Maryland Priority" Logic
    isMaryland: {
      type: Boolean,
      default: false, 
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;