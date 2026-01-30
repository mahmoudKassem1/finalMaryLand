const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Sort by isMaryland (-1 means true comes first) so they appear at top
    const products = await Product.find({}).sort({ isMaryland: -1, createdAt: -1 });
    res.json({ products }); // Wrapped in object to match frontend expectation { products: [...] }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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
    const { title, price, description, category, stock, image, isMaryland } = req.body;
    
    const product = new Product({
      title,
      price,
      description,
      category,
      stock,
      // ✅ FIX: Save to 'image' field (matches your new Model)
      image: image, 
      isMaryland: isMaryland || false,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Product creation failed: ' + error.message });
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
      product.title = title || product.title;
      product.price = price || product.price;
      product.description = description || product.description;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      
      // ✅ FIX: Check undefined to allow toggling OFF
      if (isMaryland !== undefined) {
        product.isMaryland = isMaryland;
      }

      // ✅ FIX: Update 'image' field (not imageURL)
      if (image) {
        product.image = image; 
      }

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
  updateProduct  
};