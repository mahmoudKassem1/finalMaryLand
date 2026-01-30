const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    // The link to the User who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Allows .populate('user') in controllers
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true }, // SNAPSHOT of price
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product', // Link to product for stock management
        },
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true, default: 'Alexandria' },
      phone: { type: String, required: true }, // Backup phone in case profile is outdated
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
    },
    // Financial Data
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0.0, // Stored here so we know what was charged at THIS specific time
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    // Order Lifecycle Status
    status: {
      type: String,
      required: true,
      enum: ['New', 'Delivered', 'Cancelled'],
      default: 'New', // Default state for the Admin Panel
    },
  },
  {
    timestamps: true, // Critical for "Monthly/Yearly Sales" charts
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;