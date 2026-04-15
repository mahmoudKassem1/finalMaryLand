const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail'); 

const addOrderItems = async (req, res) => {
  try {
    console.log("🚀 --- NEW ORDER ATTEMPT ---");
    console.log("USER DATA:", req.user ? "Exists" : "NULL!");
    console.log("BODY DATA:", JSON.stringify(req.body).substring(0, 100) + "...");

    // 🚨 1. Check if User is null
    if (!req.user) {
      return res.status(401).json({ message: 'Auth Error: req.user is null. Please log in again.' });
    }

    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod,
      transactionId 
    } = req.body;

    // 🚨 2. Check if orderItems is valid
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
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
      // 🚨 3. Check if the item object itself is null (Corrupted frontend cart)
      if (!item) {
        return res.status(400).json({ message: 'Corrupted cart item. Please clear your cart.' });
      }

      const productId = item._id || item.product;
      
      if (!productId) {
         return res.status(400).json({ message: 'Invalid product ID in cart' });
      }

      const dbProduct = await Product.findById(productId);
      
      if (!dbProduct) {
        return res.status(400).json({ message: `Product no longer available. Clear cart.` });
      }

      itemsPrice += dbProduct.price * Number(item.quantity || 1);
      dbOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.title,  
        image: dbProduct.image || dbProduct.imageURL, 
        price: dbProduct.price, 
        qty: Number(item.quantity || item.qty || 1)
      });
    }

    const deliveryFee = baseDeliveryFee;
    const totalAmount = itemsPrice + deliveryFee;

    // 🚨 4. Safe Order Creation
    const order = new Order({
      user: req.user._id, // We verified req.user exists above!
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
       await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // Email Notification (Non-Blocking)
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

    sendNotification();

    res.status(201).json(createdOrder);

  } catch (error) {
    console.error("🔥 FATAL ORDER ERROR:", error);
    res.status(500).json({ message: 'Order Failed: ' + error.message });
  }
};

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