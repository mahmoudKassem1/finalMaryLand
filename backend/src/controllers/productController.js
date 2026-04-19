const Product = require('../models/Product');

const normalizeCategoryQuery = (category) => {
  if (!category || typeof category !== 'string') return category;
  return category.replace(/-/g, ' ').trim();
};

const normalizeCategoryForStorage = (category) => {
  if (!category || typeof category !== 'string') return category;
  return category.replace(/-/g, ' ').trim().toUpperCase();
};

// @desc    Fetch all products (with Pagination, Search, and Low Stock filter)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // 1. Extract Query Parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const { category, lowStock, search } = req.query;
    let query = {};

    // 2. Handle Low Stock Filter
    if (lowStock === 'true') {
      query.stock = { $lt: 10 };
    }

    // 3. Handle Category Filter
    if (category) {
      if (category === 'maryland-products') {
        query.isMaryland = true;
      } else {
        const normalizedCategory = normalizeCategoryQuery(category);
        query.category = { $regex: `^${normalizedCategory}$`, $options: 'i' };
      }
    }

    // 4. ✅ FIX: Search across title, category, AND description simultaneously
    //    Previously only searched title — meaning a product named "Vitamin C"
    //    in category "Vitamins" would NOT appear when searching "Vitamins".
    //    Now uses $or so any matching field returns the product.
    //    Regex is anchored to the search term (not full-string match) so
    //    "pan" correctly matches "Panadol", "Panado", etc.
    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title:       { $regex: sanitizedSearch, $options: 'i' } },
        { category:    { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    // 5. Execute Query with Pagination and Sort
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ isMaryland: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

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