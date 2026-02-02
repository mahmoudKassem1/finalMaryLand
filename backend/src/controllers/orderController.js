const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail'); // ✅ Import Email Utility

// @desc    Create new order (Client)
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const { 
    orderItems, 
    shippingAddress, 
    paymentMethod,
    transactionId // ✅ Extract transaction ID (or "See WhatsApp")
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // 1. Fetch settings to get the delivery fee
    const settings = await Setting.findOne();
    const baseDeliveryFee = settings?.deliveryFee ?? 50;

    // 2. Validate Payment Method (Fallback if missing)
    // ✅ SAFEGUARD: If frontend sends null, default to COD
    const finalPaymentMethod = paymentMethod || 'Cash on Delivery';

    // 3. Prepare Address
    const validAddress = {
      street: shippingAddress?.street || 'Unknown Street',
      city: shippingAddress?.city || 'Alexandria',
      aptNumber: shippingAddress?.aptNumber || '',
      phone: shippingAddress?.phone || req.user.phone || '0000000000'
    };

    // 4. 🛡️ Securely calculate prices and map items 🛡️
    const dbOrderItems = [];
    let itemsPrice = 0; // This is the subtotal of all items

    for (const item of orderItems) {
      // Find the real product in the DB to ensure price security
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

    // 5. Calculate final delivery fee and total amount
    const deliveryFee = itemsPrice > 500 ? 0 : baseDeliveryFee;
    const totalAmount = itemsPrice + deliveryFee;

    // 6. Create Order
    const order = new Order({
      user: req.user._id,
      orderItems: dbOrderItems,
      shippingAddress: validAddress,
      paymentMethod: finalPaymentMethod, // ✅ Use the validated method
      itemsPrice,
      deliveryFee,
      totalAmount,
      // ✅ SAVE PAYMENT DETAILS
      paymentResult: {
        id: transactionId || 'Pending',
        status: 'pending',
        update_time: Date.now(),
        email_address: req.user.email,
      },
      // ✅ PAYMENT STATUS LOGIC
      // Manual methods (InstaPay/Vodafone) are NOT paid until Admin verifies
      isPaid: false, 
    });

    const createdOrder = await order.save();

    // 7. Update Stock
    for (const item of dbOrderItems) {
       await Product.findByIdAndUpdate(item.product, {
         $inc: { stock: -item.qty }
       });
    }

    // ---------------------------------------------------------
    // ✅ NEW: Dynamic Email Notification (With Payment Method)
    // ---------------------------------------------------------
    try {
      // A. Determine Recipients (DB > Env Fallback)
      let recipients = [];
      if (settings && settings.notificationEmails && settings.notificationEmails.length > 0) {
        recipients = settings.notificationEmails;
      } else {
        const envEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
        if (envEmail) recipients = [envEmail];
      }

      // Only proceed if we have at least one recipient
      if (recipients.length > 0) {
        
        // 🎨 B. Create Payment Method Badge for Email
        let paymentBadge = '';
        if (finalPaymentMethod === 'InstaPay') {
          paymentBadge = `<span style="background-color: #6b21a8; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">InstaPay</span>`;
        } else if (finalPaymentMethod === 'VodafoneCash') {
          paymentBadge = `<span style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Vodafone Cash</span>`;
        } else {
          paymentBadge = `<span style="background-color: #166534; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Cash on Delivery</span>`;
        }

        const itemsListHtml = dbOrderItems.map(item => 
          `<li style="margin-bottom: 5px;">
             <strong>${item.name}</strong> (x${item.qty}) - ${item.price} EGP
           </li>`
        ).join('');

        const emailHtml = `
          <h2 style="color: #DC2626;">New Order Received! 🚀</h2>
          <p><strong>Order ID:</strong> ${createdOrder._id}</p>
          <p><strong>Customer:</strong> ${req.user.name} (${req.user.email})</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Payment Method:</strong> ${paymentBadge}
            </p>
            ${transactionId ? `<p style="margin: 10px 0 0; color: #dc2626; font-weight: bold;">⚠️ Verification Note: ${transactionId}</p>` : ''}
          </div>

          <p><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold;">${totalAmount} EGP</span></p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <h3 style="color: #0F172A;">Order Items:</h3>
          <ul style="color: #334155;">${itemsListHtml}</ul>

          <h3 style="color: #0F172A;">Shipping Details:</h3>
          <p style="color: #334155;">
            ${validAddress.street}, ${validAddress.city}<br>
            <strong>Phone:</strong> ${validAddress.phone}
          </p>

          <div style="margin-top: 30px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/management-panel" 
                style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Dashboard
             </a>
          </div>
        `;

        await sendEmail({
          to: recipients.join(','), 
          subject: `New Order (${finalPaymentMethod}) - ${req.user.name}`, // ✅ Subject now matches DB
          html: emailHtml
        });
        
        console.log(`📧 Admin emails sent to: ${recipients.join(', ')}`);
      }

    } catch (emailError) {
      console.error('Failed to send admin email:', emailError.message); 
    }
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