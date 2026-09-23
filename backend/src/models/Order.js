const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    // The link to the User who placed the inquiry/order
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
      phone: { type: String, required: true },
    },
    // Optional notes/prescription details sent with the inquiry
    notes: {
      type: String,
      default: '',
    },
    // Order Lifecycle Status (aligned with WhatsApp inquiry & confirmation workflow)
    status: {
      type: String,
      required: true,
      enum: ['Inquiry Received', 'Confirmed via WhatsApp', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Inquiry Received',
    },
  },
  {
    timestamps: true, // Tracks inquiry volume and timing in admin dashboards
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;