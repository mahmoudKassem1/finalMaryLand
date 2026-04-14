const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail'); // ✅ Import Email Utility
// @desc    Create new order (Client)
const addOrderItems = async (req, res) => {
  const { 
    orderItems, 
    shippingAddress, 
    paymentMethod,
    transactionId 
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const settings = await Setting.findOne();
    const baseDeliveryFee = settings?.deliveryFee ?? 50;
    const finalPaymentMethod = paymentMethod || 'Cash on Delivery';

    const validAddress = {
      street: shippingAddress?.street || 'Unknown Street',
      city: shippingAddress?.city || 'Alexandria',
      aptNumber: shippingAddress?.aptNumber || '',
      phone: shippingAddress?.phone || req.user.phone || '0000000000'
    };

    const dbOrderItems = [];
    let itemsPrice = 0;

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item._id || item.product);
      if (dbProduct) {
        itemsPrice += dbProduct.price * Number(item.quantity || 1);
        dbOrderItems.push({
          product: dbProduct._id,
          name: dbProduct.title,  
          image: dbProduct.imageURL || dbProduct.image, 
          price: dbProduct.price, 
          qty: Number(item.quantity || item.qty || 1)
        });
      }
    }

    if (dbOrderItems.length === 0) {
      return res.status(400).json({ message: 'No valid products found' });
    }

    const deliveryFee = itemsPrice > 500 ? 0 : baseDeliveryFee;
    const totalAmount = itemsPrice + deliveryFee;

    const order = new Order({
      user: req.user._id,
      orderItems: dbOrderItems,
      shippingAddress: validAddress,
      paymentMethod: finalPaymentMethod,
      itemsPrice,
      deliveryFee,
      totalAmount,
      paymentResult: {
        id: transactionId || 'Pending',
        status: 'pending',
        update_time: Date.now(),
        email_address: req.user.email,
      },
      isPaid: false, 
    });

    const createdOrder = await order.save();

    // Update Stock
    for (const item of dbOrderItems) {
       await Product.findByIdAndUpdate(item.product, {
         $inc: { stock: -item.qty }
       });
    }

    // ---------------------------------------------------------
    // ✅ BACKGROUND EMAIL NOTIFICATION (Non-Blocking)
    // ---------------------------------------------------------
    const sendNotification = async () => {
      try {
        let recipients = [];
        if (settings?.notificationEmails?.length > 0) {
          recipients = settings.notificationEmails;
        } else {
          const envEmail = process.env.ADMIN_EMAIL || process.env.NOTIFY_EMAIL;
          if (envEmail) recipients = [envEmail];
        }

        if (recipients.length > 0) {
          const itemsListHtml = dbOrderItems.map(item => 
            `<li><strong>${item.name}</strong> (x${item.qty}) - ${item.price} EGP</li>`
          ).join('');

          const emailHtml = `
            <h2 style="color: #DC2626;">New Order Received! 🚀</h2>
            <p><strong>Order ID:</strong> ${createdOrder._id}</p>
            <p><strong>Customer:</strong> ${req.user.name}</p>
            <p><strong>Payment:</strong> ${finalPaymentMethod}</p>
            <p><strong>Total:</strong> ${totalAmount} EGP</p>
            <hr>
            <h3>Items:</h3>
            <ul>${itemsListHtml}</ul>
            <h3>Shipping:</h3>
            <p>${validAddress.street}, ${validAddress.city}<br>Phone: ${validAddress.phone}</p>
          `;

          // ✅ No 'await' here inside the controller's main flow
          sendEmail({
            to: recipients, 
            subject: `New Order (${finalPaymentMethod}) - ${req.user.name}`,
            html: emailHtml
          });
        }
      } catch (err) {
        console.error('Background Email logic failed:', err.message);
      }
    };

    // Trigger the email but don't wait for it
    sendNotification();

    // ---------------------------------------------------------
    // ✅ RESPOND IMMEDIATELY TO CLIENT
    // ---------------------------------------------------------
    res.status(201).json(createdOrder);

  } catch (error) {
    console.error("Order Error:", error.message);
    res.status(500).json({ message: 'Order Failed: ' + error.message });
  }
};
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'orderItems.product',
        select: 'title imageURL price'
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({ message: 'Error fetching your orders' });
  }
};

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// @desc    Update order status (Admin Only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = req.body.status || order.status;
      if (req.body.status === 'Delivered') {
        order.deliveredAt = Date.now();
      }
      
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
};

module.exports = {
  addOrderItems,     
  getOrderById,      
  getMyOrders,
  getOrders,         
  updateOrderStatus  
};