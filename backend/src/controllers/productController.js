const Product = require('../models/Product');

const MAX_LIMIT = 100;
const CI_COLLATION = { locale: 'en', strength: 2 }; // case-insensitive, index-friendly

const normalizeCategoryQuery = (category) => {
  if (!category || typeof category !== 'string') return category;
  return category.replace(/-/g, ' ').trim();
};

const normalizeCategoryForStorage = (category) => {
  if (!category || typeof category !== 'string') return category;
  return category.replace(/-/g, ' ').trim().toUpperCase();
};

// Every sort ends with _id so pagination is stable (no duplicated / skipped items between pages)
const SORT_OPTIONS = {
  latest:   { createdAt: -1, _id: -1 },
  featured: { isMaryland: -1, createdAt: -1, _id: -1 },
  name:     { title: 1, _id: 1 },
};

// @desc    Fetch all products (with Pagination, Sort, Search, and Low Stock filter)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // 1. Extract Query Parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { category, lowStock, search, sort } = req.query;
    const query = {};

    // 2. Handle Low Stock Filter
    if (lowStock === 'true') {
      query.stock = { $lt: 10 };
    }

    // 3. Handle Category Filter ('all' or empty = no filter)
    if (category && category !== 'all') {
      if (category === 'maryland-products') {
        query.isMaryland = true;
      } else {
        // Exact match (case-insensitive via collation) instead of an unanchored-index-unfriendly regex,
        // so MongoDB can use the category indexes.
        query.category = normalizeCategoryQuery(category);
      }
    }

    // 4. Search across title, category, AND description
    //    (regex search cannot use a normal index; keep it for admin/search screens only)
    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title:       { $regex: sanitizedSearch, $options: 'i' } },
        { category:    { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    // 5. Sort. No `sort` param keeps the previous default (Maryland first, then newest)
    //    so other pages that call this endpoint behave exactly as before.
    const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.featured;

    // Only apply the collation when it is actually needed, so plain queries use plain indexes
    const needsCollation = typeof query.category === 'string' || sort === 'name';

    const buildFind = () => {
      const q = Product.find(query).sort(sortBy).skip(skip).limit(limit).lean();
      return needsCollation ? q.collation(CI_COLLATION) : q;
    };
    const buildCount = () => {
      const q = Product.countDocuments(query);
      return needsCollation ? q.collation(CI_COLLATION) : q;
    };

    // 6. Run the page query and the count in parallel
    const [products, totalProducts] = await Promise.all([buildFind(), buildCount()]);

    res.json({
      products,
      page,
      pages: Math.ceil(totalProducts / limit),
      total: totalProducts,
      hasMore: skip + limit < totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { title, name, price, description, category, stock, image, isMaryland } = req.body;
    const normalizedCategory = normalizeCategoryForStorage(category);

    const product = new Product({
      title: title || name,
      price,
      description,
      category: normalizedCategory,
      stock: stock || 0,
      image,
      isMaryland: isMaryland || false,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { title, price, description, category, stock, image, isMaryland } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.title       = title       || product.title;
      product.price       = price       || product.price;
      product.description = description || product.description;
      product.category    = category ? normalizeCategoryForStorage(category) : product.category;
      product.stock       = stock !== undefined ? Number(stock) : product.stock;

      if (isMaryland !== undefined) product.isMaryland = isMaryland;
      if (image) product.image = image;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed: ' + error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
};