const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail');

const addOrderItems = async (req, res) => {
  try {
    console.log("🚀 --- NEW ORDER/INQUIRY ATTEMPT ---");
    console.log("USER DATA:", req.user ? "Exists" : "NULL!");

    // 1. Check if User is null
    if (!req.user) {
      return res.status(401).json({ message: 'Auth Error: req.user is null. Please log in again.' });
    }

    const { 
      orderItems, 
      shippingAddress, 
      notes 
    } = req.body;

    // 2. Validate order items
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'No inquiry items provided' });
    }

    const validAddress = {
      street: shippingAddress?.street || 'Unknown Street',
      city: shippingAddress?.city || 'Alexandria',
      phone: shippingAddress?.phone || req.user.phone || '0000000000'
    };

    const dbOrderItems = [];

    for (const item of orderItems) {
      if (!item) {
        return res.status(400).json({ message: 'Corrupted item in list. Please refresh your cart.' });
      }

      const productId = item._id || item.product;
      
      if (!productId) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const dbProduct = await Product.findById(productId);
      
      if (!dbProduct) {
        return res.status(400).json({ message: 'One or more items are no longer available.' });
      }

      dbOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.title || dbProduct.name,
        image: dbProduct.image || dbProduct.imageURL || '',
        qty: Number(item.quantity || item.qty || 1)
      });
    }

    // 3. Safe Order/Inquiry Creation (No monetary fields)
    const order = new Order({
      user: req.user._id,
      orderItems: dbOrderItems,
      shippingAddress: validAddress,
      notes: notes || '',
      status: 'Inquiry Received'
    });

    const createdOrder = await order.save();

    // 4. Background Email Notification to Admin/Staff
    const sendNotification = async () => {
      try {
        const settings = await Setting.findOne();
        let recipients = [];
        if (settings?.notificationEmails?.length > 0) {
          recipients = settings.notificationEmails;
        } else {
          const envEmail = process.env.ADMIN_EMAIL || process.env.NOTIFY_EMAIL;
          if (envEmail) recipients = [envEmail];
        }

        if (recipients.length > 0) {
          const itemsListHtml = dbOrderItems.map(item => 
            `<li><strong>${item.name}</strong> (Qty: ${item.qty})</li>`
          ).join('');

          const emailHtml = `
            <h2 style="color: #0284C7;">New Order Inquiry Received! 📋</h2>
            <p><strong>Order ID:</strong> ${createdOrder._id}</p>
            <p><strong>Customer:</strong> ${req.user.name}</p>
            <p><strong>Status:</strong> Awaiting WhatsApp Confirmation</p>
            ${notes ? `<p><strong>Customer Notes:</strong> ${notes}</p>` : ''}
            <hr>
            <h3>Requested Items:</h3>
            <ul>${itemsListHtml}</ul>
            <h3>Shipping Details:</h3>
            <p>${validAddress.street}, ${validAddress.city}<br><strong>Phone:</strong> ${validAddress.phone}</p>
          `;

          sendEmail({
            to: recipients, 
            subject: `New Order Inquiry - ${req.user.name}`,
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
    res.status(500).json({ message: 'Order Inquiry Failed: ' + error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'title image imageURL');

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
        select: 'title image imageURL'
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
      .populate('orderItems.product', 'title image imageURL')
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
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order' });
  }
};

const deleteAllOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} orders` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all orders' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  deleteAllOrders
};