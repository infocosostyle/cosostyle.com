import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { auth, adminOnly } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

// Models
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Blog from '../models/Blog.js';
import Banner from '../models/Banner.js';
import Return from '../models/Return.js';
import Notification from '../models/Notification.js';
import SupportTicket from '../models/SupportTicket.js';
import Newsletter from '../models/Newsletter.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'coso_secret_token_100_percent_cotton';

// In-memory stores (replace with DB in production)
const passwordRecoveryCodes = new Map();
const mockOtpStorage = new Map();
const backInStockNotifications = new Map(); // productId -> [emails]

// ── Email Logger ──────────────────────────────────────────────────────────────
const logEmail = (toEmail, subject, bodyText) => {
  const logDir = path.resolve('data');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, 'emails.log');
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] TO: ${toEmail} | SUBJECT: ${subject}\nBODY: ${bodyText}\n----------------------------------------\n`;
  fs.appendFileSync(logPath, entry, 'utf-8');
};

// ── Helper: Award Loyalty Points ──────────────────────────────────────────────
const awardLoyaltyPoints = async (userEmail, points, reason) => {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return;
    const currentPoints = user.loyaltyPoints || 0;
    await User.findByIdAndUpdate(user._id, { loyaltyPoints: currentPoints + points });
    await Notification.create({
      userEmail,
      title: `+${points} Loyalty Points Earned`,
      message: `You earned ${points} points for ${reason}. Total: ${currentPoints + points} points.`,
      link: '/dashboard'
    });
  } catch (err) {
    console.error('Failed to award loyalty points:', err.message);
  }
};

// ── Generate Referral Code ────────────────────────────────────────────────────
const generateReferralCode = (name) => {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
};

// =============================================================================
// AUTH ROUTES
// =============================================================================

// Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        loyaltyPoints: user.loyaltyPoints || 0,
        referralCode: user.referralCode || '',
        wishlist: user.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during authentication.' });
  }
});

// Register
router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const role = email.toLowerCase() === 'admin@cosostyle.com' ? 'admin' : 'user';
    const referralCode = generateReferralCode(name);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      addresses: [],
      phone: '',
      avatar: '',
      loyaltyPoints: 50, // Welcome bonus points
      referralCode,
      wishlist: []
    });

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Welcome email
    logEmail(user.email, 'Welcome to CoSoStyle!',
      `Dear ${user.name},\n\nWelcome to CoSoStyle — premium organic streetwear.\n\nYour account is active. You've received 50 welcome loyalty points!\nReferral Code: ${referralCode}\n\nUse code COSO15 for 15% off your first order.\n\nBest Regards,\nCoSoStyle Studio`
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        addresses: [],
        loyaltyPoints: 50,
        referralCode,
        wishlist: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Get Profile
router.get('/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      addresses: user.addresses || [],
      loyaltyPoints: user.loyaltyPoints || 0,
      referralCode: user.referralCode || '',
      wishlist: user.wishlist || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update Profile
router.put('/auth/profile', auth, async (req, res) => {
  const { name, phone, avatar } = req.body;
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await User.findByIdAndUpdate(user._id, updates, { new: true });
    res.json({
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone || '',
      avatar: updated.avatar || '',
      addresses: updated.addresses || [],
      loyaltyPoints: updated.loyaltyPoints || 0,
      referralCode: updated.referralCode || '',
      wishlist: updated.wishlist || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// Change Password
router.put('/auth/password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Both passwords are required.' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error changing password.' });
  }
});

// Address CRUD
router.post('/auth/addresses', auth, async (req, res) => {
  const address = req.body;
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const currentAddresses = user.addresses || [];
    if (address.isDefault) currentAddresses.forEach(a => a.isDefault = false);

    if (address.id) {
      const idx = currentAddresses.findIndex(a => a.id === address.id);
      if (idx !== -1) currentAddresses[idx] = address;
    } else {
      address.id = Date.now();
      if (currentAddresses.length === 0) address.isDefault = true;
      currentAddresses.push(address);
    }

    const updated = await User.findByIdAndUpdate(user._id, { addresses: currentAddresses }, { new: true });
    res.json(updated.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error saving address.' });
  }
});

router.delete('/auth/addresses/:id', auth, async (req, res) => {
  const addressId = parseInt(req.params.id);
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    let currentAddresses = (user.addresses || []).filter(a => a.id !== addressId);
    if (currentAddresses.length > 0 && !currentAddresses.some(a => a.isDefault)) {
      currentAddresses[0].isDefault = true;
    }

    const updated = await User.findByIdAndUpdate(user._id, { addresses: currentAddresses }, { new: true });
    res.json(updated.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting address.' });
  }
});

// Forgot Password
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    passwordRecoveryCodes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });
    logEmail(email, 'Password Recovery Code — CoSoStyle', `Your password reset code: ${code}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`);
    res.json({ success: true, message: 'Recovery code dispatched. Check server/data/emails.log.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reset Password
router.post('/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields required.' });
  try {
    const entry = passwordRecoveryCodes.get(email);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      return res.status(400).json({ message: 'Code is invalid or expired.' });
    }
    passwordRecoveryCodes.delete(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    logEmail(email, 'Password Changed — CoSoStyle', 'Your password was successfully updated. If you did not request this, contact support immediately.');
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Google Auth Simulation
router.post('/auth/google', async (req, res) => {
  const { email, name, googleId } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt);
      const referralCode = generateReferralCode(name || 'USER');
      user = await User.create({
        name: name || 'Google User',
        email,
        password: hashedPassword,
        role: 'user',
        addresses: [],
        phone: '',
        avatar: '',
        loyaltyPoints: 50,
        referralCode,
        wishlist: []
      });
      logEmail(email, 'Welcome to CoSoStyle!', `Your CoSoStyle account via Google is active. Referral code: ${referralCode}`);
    }

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        loyaltyPoints: user.loyaltyPoints || 0,
        referralCode: user.referralCode || '',
        wishlist: user.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Google auth server error.' });
  }
});

// OTP Send
router.post('/auth/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found. Please register first.' });
    const code = '123456'; // Demo OTP
    mockOtpStorage.set(email, code);
    logEmail(email, 'OTP Code — CoSoStyle', `Your one-time login code: ${code} (valid for 10 minutes)`);
    res.json({ success: true, message: 'OTP sent. Use code: 123456 for demo.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// OTP Verify
router.post('/auth/otp/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required.' });
  try {
    const correctCode = mockOtpStorage.get(email);
    if (!correctCode || correctCode !== code) {
      return res.status(400).json({ message: 'Incorrect or expired OTP.' });
    }
    mockOtpStorage.delete(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        loyaltyPoints: user.loyaltyPoints || 0,
        referralCode: user.referralCode || '',
        wishlist: user.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed.' });
  }
});

// =============================================================================
// WISHLIST ROUTES (backend-persisted)
// =============================================================================

router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ wishlist: user.wishlist || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error loading wishlist.' });
  }
});

router.post('/wishlist/toggle', auth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId required.' });
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    let wishlist = user.wishlist || [];
    const pid = parseInt(productId);
    if (wishlist.includes(pid)) {
      wishlist = wishlist.filter(id => id !== pid);
    } else {
      wishlist.push(pid);
    }

    const updated = await User.findByIdAndUpdate(user._id, { wishlist }, { new: true });
    res.json({ wishlist: updated.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling wishlist.' });
  }
});

// =============================================================================
// LOYALTY POINTS ROUTES
// =============================================================================

router.get('/loyalty', auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ points: user.loyaltyPoints || 0, referralCode: user.referralCode || '' });
  } catch (err) {
    res.status(500).json({ message: 'Error loading loyalty data.' });
  }
});

// =============================================================================
// PRODUCTS ROUTES
// =============================================================================

router.get('/products', async (req, res) => {
  try {
    const list = await Product.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading catalog.' });
  }
});

router.get('/products/:id', async (req, res) => {
  const prodId = parseInt(req.params.id);
  try {
    const product = await Product.findOne({ id: prodId });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reviews
router.get('/products/:id/reviews', async (req, res) => {
  const prodId = parseInt(req.params.id);
  try {
    const reviews = await Review.find({ productId: prodId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error loading reviews.' });
  }
});

router.post('/products/:id/reviews', async (req, res) => {
  const prodId = parseInt(req.params.id);
  const { user, rating, comment } = req.body;
  if (!user || !rating || !comment) return res.status(400).json({ message: 'All review fields required.' });
  try {
    const review = await Review.create({
      productId: prodId,
      user,
      rating: parseInt(rating),
      comment,
      date: new Date().toISOString().split('T')[0]
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post review.' });
  }
});

router.put('/products/:id/reviews/:reviewId/like', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    const updated = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { likes: (review.likes || 0) + 1, helpful: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to like review.' });
  }
});

// Back-in-stock notification signup
router.post('/products/:id/notify-back-in-stock', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required.' });
  const pid = req.params.id;
  if (!backInStockNotifications.has(pid)) {
    backInStockNotifications.set(pid, new Set());
  }
  backInStockNotifications.get(pid).add(email);
  logEmail(email, 'Back-in-Stock Notification Registered', `You will be notified when product #${pid} is back in stock at CoSoStyle.`);
  res.json({ success: true, message: 'You will be notified when this product is back in stock.' });
});

// =============================================================================
// ORDERS ROUTES
// =============================================================================

router.get('/orders', auth, async (req, res) => {
  try {
    const list = await Order.find({ userEmail: req.userEmail });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading orders.' });
  }
});

// BUG FIX: Allow guests to view their order confirmation by order ID
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Access control: check auth if provided, otherwise allow if it's a guest order
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (order.userEmail !== decoded.email && decoded.role !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized access.' });
        }
      } catch {
        // Invalid token - allow if it's a guest order
        if (order.userEmail !== 'guest@cosostyle.com' && !order.guestEmail) {
          return res.status(403).json({ message: 'Authentication required.' });
        }
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error loading order.' });
  }
});

router.post('/orders', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  let userEmail = 'guest@cosostyle.com';
  let userRole = 'guest';

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userEmail = decoded.email;
      userRole = decoded.role || 'user';
    } catch (err) {
      if (!req.body.guestEmail) {
        return res.status(401).json({ message: 'Session expired. Please login or checkout as guest.' });
      }
    }
  }

  const orderData = req.body;
  const finalEmail = orderData.guestEmail || userEmail;

  try {
    // Inventory verification & deduction
    for (const item of orderData.items || []) {
      const prod = await Product.findOne({ id: item.id });
      if (!prod) return res.status(404).json({ message: `Product "${item.title}" not found.` });

      if (item.size) {
        const variants = prod.variants || [];
        const varIdx = variants.findIndex(v => v.size === item.size);
        if (varIdx !== -1) {
          if (variants[varIdx].inventory < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock for ${item.title} (Size: ${item.size}). Remaining: ${variants[varIdx].inventory}` });
          }
          variants[varIdx].inventory -= item.quantity;
        }
      }

      if (prod.inventory < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.title}. Remaining: ${prod.inventory}` });
      }
      prod.inventory -= item.quantity;

      let availability = 'in-stock';
      if (prod.inventory === 0) availability = 'out-of-stock';
      else if (prod.inventory <= 5) availability = 'low-stock';

      await Product.findByIdAndUpdate(prod._id, {
        inventory: prod.inventory,
        availability,
        variants: prod.variants
      });

      // Notify back-in-stock subscribers if product restocked (handled separately)
    }

    const newOrder = await Order.create({
      userEmail: finalEmail,
      date: new Date().toISOString().split('T')[0],
      status: 'Placed',
      trackingNumber: `1Z${Math.random().toString(36).substring(2, 17).toUpperCase()}`,
      ...orderData
    });

    // Award loyalty points (10 points per ₹100 spent) for registered users
    if (userRole !== 'guest') {
      const pointsToAward = Math.floor((newOrder.total || 0) / 10);
      await awardLoyaltyPoints(finalEmail, pointsToAward, `order #${newOrder._id}`);
    }

    // Order confirmation email
    logEmail(
      finalEmail,
      'Order Confirmed — CoSoStyle',
      `Dear Customer,\n\nYour order #${newOrder._id} is confirmed!\n\nTotal: ₹${(newOrder.total || 0).toFixed(2)}\nTracking: ${newOrder.trackingNumber}\nEstimated Delivery: 3-5 business days\n\nThank you for shopping at CoSoStyle.\nTeam CoSoStyle`
    );

    // Admin notification
    logEmail(
      'admin@cosostyle.com',
      `[NEW ORDER] #${newOrder._id} — ₹${(newOrder.total || 0).toFixed(2)}`,
      `New order received:\nCustomer: ${finalEmail}\nOrder ID: ${newOrder._id}\nTotal: ₹${(newOrder.total || 0).toFixed(2)}\nItems: ${(newOrder.items || []).length}`
    );

    res.json(newOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Failed to place order.' });
  }
});

router.put('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (!['Placed', 'Processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel shipped or delivered orders.' });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
    logEmail(order.userEmail, 'Order Cancelled — CoSoStyle', `Your order #${order._id} has been cancelled. Refund will be processed in 3-5 business days.`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order.' });
  }
});

// Exchange Request (NEW)
router.post('/orders/:id/exchange', auth, async (req, res) => {
  const { reason, newSize, newColor, items } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.userEmail !== req.userEmail) return res.status(403).json({ message: 'Unauthorized.' });

    // Create a return with exchange flag
    const retReq = await Return.create({
      orderId: req.params.id,
      userEmail: req.userEmail,
      items: items || order.items,
      reason: `EXCHANGE REQUEST: ${reason}. New Size: ${newSize || 'Same'}, New Color: ${newColor || 'Same'}`,
      refundAmount: 0, // Exchange, not refund
      status: 'Pending',
      type: 'Exchange'
    });

    await Order.findByIdAndUpdate(req.params.id, { status: 'Exchange Requested' });
    await Notification.create({
      userEmail: req.userEmail,
      title: 'Exchange Request Submitted',
      message: `Your exchange request for order #${req.params.id} is under review.`,
      link: '/dashboard'
    });

    logEmail(req.userEmail, 'Exchange Request Received — CoSoStyle', `Your exchange request for order #${req.params.id} has been received. We will process it within 2-3 business days.`);
    res.json(retReq);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit exchange request.' });
  }
});

// =============================================================================
// COUPON ROUTES
// =============================================================================

router.post('/coupons/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code required.' });
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon code.' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Server error validating coupon.' });
  }
});

// =============================================================================
// NEWSLETTER ROUTES
// =============================================================================

router.post('/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (!existing.active) {
        await Newsletter.findByIdAndUpdate(existing._id, { active: true });
        return res.json({ success: true, message: 'Welcome back! You have been resubscribed.' });
      }
      return res.json({ success: true, message: 'You are already subscribed!' });
    }
    await Newsletter.create({ email });
    logEmail(email, 'Subscribed to CoSoStyle Newsletter', `Welcome to the CoSoStyle drop list!\n\nYou will receive exclusive early access invitations, limited discount vouchers, and studio news.\n\nUse code COSO15 for 15% off your first order.\n\nTeam CoSoStyle`);
    res.json({ success: true, message: 'Successfully subscribed to exclusive drop announcements!' });
  } catch (err) {
    res.status(500).json({ message: 'Subscription failed.' });
  }
});

router.post('/newsletter/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required.' });
  try {
    await Newsletter.findByIdAndUpdate((await Newsletter.findOne({ email }))?._id, { active: false });
    res.json({ success: true, message: 'Unsubscribed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Unsubscribe failed.' });
  }
});

// =============================================================================
// SUPPORT TICKET ROUTES
// =============================================================================

router.post('/support/tickets', async (req, res) => {
  const { name, email, subject, message, category } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields required.' });
  }
  try {
    const ticketId = `CST-${Date.now().toString().slice(-6)}`;
    const ticket = await SupportTicket.create({
      ticketId,
      name,
      email,
      subject,
      message,
      category: category || 'General',
      status: 'Open',
      priority: 'Normal',
      userEmail: email
    });

    // Auto-reply to customer
    logEmail(email, `Support Ticket #${ticketId} Received — CoSoStyle`,
      `Dear ${name},\n\nThank you for contacting CoSoStyle support.\nYour ticket #${ticketId} has been received.\n\nSubject: ${subject}\nWe aim to respond within 24 hours.\n\nFor urgent issues: team@cosostyle.com\n\nBest Regards,\nCoSoStyle Support Team`
    );

    // Admin notification
    logEmail('admin@cosostyle.com', `[SUPPORT TICKET] #${ticketId} — ${subject}`,
      `New support ticket:\nTicket ID: ${ticketId}\nCustomer: ${name} (${email})\nCategory: ${category || 'General'}\nSubject: ${subject}\nMessage: ${message}`
    );

    res.json({ success: true, ticket, message: `Ticket #${ticketId} submitted successfully.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit ticket.' });
  }
});

router.get('/support/tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userEmail: req.userEmail });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Error loading tickets.' });
  }
});

// =============================================================================
// RETURNS ROUTES
// =============================================================================

router.post('/orders/:id/return', auth, async (req, res) => {
  const { reason, items, refundAmount } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.userEmail !== req.userEmail) return res.status(403).json({ message: 'Unauthorized.' });

    const retReq = await Return.create({
      orderId: req.params.id,
      userEmail: req.userEmail,
      items,
      reason,
      refundAmount: parseFloat(refundAmount),
      status: 'Pending',
      type: 'Return'
    });

    await Order.findByIdAndUpdate(req.params.id, { status: 'Return Requested' });
    await Notification.create({
      userEmail: req.userEmail,
      title: 'Return Request Submitted',
      message: `Return request for order #${req.params.id} is under review.`,
      link: '/dashboard'
    });

    res.json(retReq);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit return.' });
  }
});

router.get('/returns', auth, async (req, res) => {
  try {
    const list = await Return.find({ userEmail: req.userEmail });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading returns.' });
  }
});

// =============================================================================
// BLOGS ROUTES
// =============================================================================

const defaultBlogs = [
  {
    title: 'THE ART OF PURE ORGANIC COTTON WEAVES',
    slug: 'pure-organic-cotton-weaves',
    image: '/src/assets/tshirt 1/05-05-2025 christian00425.jpg',
    category: 'STUDIO NEWS',
    excerpt: 'An inside look at our organic cotton sourcing, 240 GSM knitting structure, and how it shapes the geometric drape of modern streetwear.',
    content: 'Luxury starts with the thread. At CoSoStyle, every drop uses 100% organic long-staple combed ringspun cotton. The ringspun processing stretches cotton fibers to their limit, generating tensile strength, while combed treatment removes micro impurities. The result is a 240 GSM weave that falls with structural stability.',
    tags: ['FABRIC', 'STUDIO', 'QUALITY'],
    date: '2026-06-10',
    readTime: '4 MIN'
  },
  {
    title: 'THE COSOSTYLE GUIDE TO SILENT STREETWEAR',
    slug: 'silent-streetwear-silhouettes',
    image: '/src/assets/tshirt 3/05-05-2025 christian00468.jpg',
    category: 'DESIGN DIARY',
    excerpt: 'How boxy cuts, drop shoulder lines, and structured collar design define the contemporary fashion-first look.',
    content: 'Streetwear shapes have shifted from ad-hoc oversized to intentional geometric architecture. Our drop-shoulder cuts align precisely with shoulder bones, creating natural contour. Combined with lay-flat ribbed cuffs, this prevents collar puckering.',
    tags: ['DESIGN', 'FIT', 'STYLING'],
    date: '2026-06-18',
    readTime: '6 MIN'
  }
];

router.get('/blogs', async (req, res) => {
  try {
    let list = await Blog.find({});
    if (list.length === 0) {
      for (const b of defaultBlogs) await Blog.create(b);
      list = await Blog.find({});
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading blogs.' });
  }
});

router.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Error loading blog.' });
  }
});

// =============================================================================
// BANNERS ROUTES
// =============================================================================

const defaultBanners = [
  {
    title: 'PURE COTTON. PURE INTENT.',
    subtitle: 'heavyweight 240 GSM organic drops with zero compromise.',
    image: '/src/assets/hero.png',
    videoUrl: '',
    link: '/shop',
    active: true,
    position: 0
  }
];

router.get('/banners', async (req, res) => {
  try {
    let list = await Banner.find({ active: true });
    if (list.length === 0) {
      for (const b of defaultBanners) await Banner.create(b);
      list = await Banner.find({ active: true });
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading banners.' });
  }
});

// =============================================================================
// NOTIFICATIONS ROUTES
// =============================================================================

router.get('/notifications', auth, async (req, res) => {
  try {
    const list = await Notification.find({ userEmail: req.userEmail });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading notifications.' });
  }
});

router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification.' });
  }
});

router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    const list = await Notification.find({ userEmail: req.userEmail, read: false });
    for (const n of list) {
      await Notification.findByIdAndUpdate(n._id, { read: true });
    }
    res.json({ success: true, count: list.length });
  } catch (err) {
    res.status(500).json({ message: 'Error marking all notifications read.' });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Analytics KPIs + Monthly Revenue Trend
router.get('/admin/analytics', auth, adminOnly, async (req, res) => {
  try {
    const allOrders = await Order.find({});
    const activeOrders = allOrders.filter(o => o.status !== 'Cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const ordersCount = activeOrders.length;
    const usersCount = await User.countDocuments({ role: 'user' });
    const reviewsCount = await Review.countDocuments({});

    // Category sales
    const categorySales = {};
    activeOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const cat = item.category || 'classic';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
      });
    });
    const categoryChartData = Object.keys(categorySales).map(key => ({
      name: key.toUpperCase(),
      value: Math.round(categorySales[key])
    }));

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyRevenue[key] = 0;
    }
    activeOrders.forEach(order => {
      const date = new Date(order.date || order.createdAt);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      if (monthlyRevenue[monthKey] !== undefined) {
        monthlyRevenue[monthKey] += (order.total || 0);
      }
    });
    const revenueTrend = Object.entries(monthlyRevenue).map(([month, value]) => ({
      month,
      revenue: Math.round(value)
    }));

    // Top products
    const productSales = {};
    activeOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.title || `Product #${item.id}`;
        productSales[key] = (productSales[key] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, units]) => ({ name, units }));

    res.json({
      kpis: {
        revenue: Math.round(revenue),
        ordersCount,
        usersCount,
        reviewsCount,
        avgOrderValue: ordersCount > 0 ? Math.round(revenue / ordersCount) : 0,
        conversionRate: ordersCount > 0 ? ((ordersCount / (usersCount || 1)) * 10).toFixed(1) + '%' : '0%'
      },
      categoryChart: categoryChartData,
      revenueTrend,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ message: 'Analytics extraction failed.' });
  }
});

// All Admin Orders
router.get('/admin/orders', auth, adminOnly, async (req, res) => {
  try {
    const list = await Order.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading orders.' });
  }
});

router.put('/admin/orders/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' });
  }
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    logEmail(updated.userEmail, `Order Status Updated: ${status} — CoSoStyle`,
      `Dear Customer,\n\nYour order #${updated._id} status: ${status}.\nTracking: ${updated.trackingNumber}\n\nThank you for shopping at CoSoStyle.`
    );
    // Notify customer
    await Notification.create({
      userEmail: updated.userEmail,
      title: `Order ${status}`,
      message: `Your order #${updated._id} has been updated to ${status}.`,
      link: `/order-confirmation/${updated._id}`
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status.' });
  }
});

// Admin Products CRUD
router.post('/admin/products', auth, adminOnly, async (req, res) => {
  try {
    const list = await Product.find({});
    const nextId = list.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;
    const newProduct = await Product.create({ id: nextId, ...req.body });
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

router.put('/admin/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// Quick stock update endpoint
router.put('/admin/products/:id/stock', auth, adminOnly, async (req, res) => {
  const { inventory } = req.body;
  try {
    let availability = 'in-stock';
    if (inventory === 0) availability = 'out-of-stock';
    else if (inventory <= 5) availability = 'low-stock';

    const updated = await Product.findByIdAndUpdate(req.params.id, { inventory: parseInt(inventory), availability }, { new: true });

    // Notify back-in-stock subscribers if restocked
    if (inventory > 0) {
      const pid = updated.id?.toString();
      if (backInStockNotifications.has(pid)) {
        for (const email of backInStockNotifications.get(pid)) {
          logEmail(email, `Back in Stock: ${updated.title} — CoSoStyle`,
            `Great news! ${updated.title} is back in stock. Shop now before it sells out again: cosostyle.com/product/${updated.id}`
          );
        }
        backInStockNotifications.delete(pid);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update stock.' });
  }
});

router.delete('/admin/products/:id', auth, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

// Admin Inventory Overview
router.get('/admin/inventory', auth, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({});
    const low = products.filter(p => p.inventory <= 10 && p.inventory > 0);
    const out = products.filter(p => p.inventory === 0 || p.availability === 'out-of-stock');
    const healthy = products.filter(p => p.inventory > 10);
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.inventory || 0), 0);

    res.json({
      summary: {
        total: products.length,
        lowStock: low.length,
        outOfStock: out.length,
        healthy: healthy.length,
        totalInventoryValue: Math.round(totalValue)
      },
      lowStockProducts: low,
      outOfStockProducts: out,
      allProducts: products
    });
  } catch (err) {
    res.status(500).json({ message: 'Error loading inventory.' });
  }
});

// Admin Coupons
router.get('/admin/coupons', auth, adminOnly, async (req, res) => {
  try {
    const list = await Coupon.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading coupons.' });
  }
});

router.post('/admin/coupons', auth, adminOnly, async (req, res) => {
  const { code, discountPercent } = req.body;
  if (!code || !discountPercent) return res.status(400).json({ message: 'Code and discount required.' });
  try {
    const newCoupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountPercent: parseFloat(discountPercent) / 100,
      active: true
    });
    res.json(newCoupon);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create coupon.' });
  }
});

router.put('/admin/coupons/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    const updated = await Coupon.findByIdAndUpdate(req.params.id, { active: !coupon.active }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle coupon.' });
  }
});

router.delete('/admin/coupons/:id', auth, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete coupon.' });
  }
});

// Admin Returns
router.get('/admin/returns', auth, adminOnly, async (req, res) => {
  try {
    const list = await Return.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading returns.' });
  }
});

router.put('/admin/returns/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await Return.findByIdAndUpdate(req.params.id, { status }, { new: true });
    const orderStatus = status === 'Approved' ? 'Refunded' : 'Return Rejected';
    await Order.findByIdAndUpdate(updated.orderId, { status: orderStatus });
    await Notification.create({
      userEmail: updated.userEmail,
      title: `Return ${status}`,
      message: `Your return/exchange request has been ${status.toLowerCase()}.`,
      link: '/dashboard'
    });
    logEmail(updated.userEmail, `Return Request ${status} — CoSoStyle`, `Dear Customer,\n\nYour return request has been ${status.toLowerCase()}.\n${status === 'Approved' ? 'Refund will be processed in 3-5 business days.' : 'Please contact us for further assistance.'}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update return.' });
  }
});

// Admin Blogs
router.post('/admin/blogs', auth, adminOnly, async (req, res) => {
  try {
    const newBlog = await Blog.create({ ...req.body, date: new Date().toISOString().split('T')[0] });
    res.json(newBlog);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create blog.' });
  }
});

router.put('/admin/blogs/:id', auth, adminOnly, async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update blog.' });
  }
});

router.delete('/admin/blogs/:id', auth, adminOnly, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete blog.' });
  }
});

// Admin Banners (BUG FIX: show ALL banners for admin, not just active)
router.get('/admin/banners', auth, adminOnly, async (req, res) => {
  try {
    const list = await Banner.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading banners.' });
  }
});

router.post('/admin/banners', auth, adminOnly, async (req, res) => {
  try {
    const newBanner = await Banner.create({ ...req.body, active: req.body.active !== false });
    res.json(newBanner);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create banner.' });
  }
});

router.put('/admin/banners/:id', auth, adminOnly, async (req, res) => {
  try {
    const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update banner.' });
  }
});

router.delete('/admin/banners/:id', auth, adminOnly, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete banner.' });
  }
});

// Admin Users
router.get('/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const list = await User.find({});
    const cleanList = list.map(u => ({
      _id: u._id,
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      loyaltyPoints: u.loyaltyPoints || 0,
      createdAt: u.createdAt
    }));
    res.json(cleanList);
  } catch (err) {
    res.status(500).json({ message: 'Error loading users.' });
  }
});

router.put('/admin/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role.' });
  }
});

// Admin Reviews
router.get('/admin/reviews', auth, adminOnly, async (req, res) => {
  try {
    const list = await Review.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading reviews.' });
  }
});

router.delete('/admin/reviews/:id', auth, adminOnly, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review.' });
  }
});

// Admin Newsletter Subscribers
router.get('/admin/newsletter', auth, adminOnly, async (req, res) => {
  try {
    const list = await Newsletter.find({ active: true });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading newsletter subscribers.' });
  }
});

// Admin Support Tickets
router.get('/admin/support/tickets', auth, adminOnly, async (req, res) => {
  try {
    const list = await SupportTicket.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error loading tickets.' });
  }
});

router.put('/admin/support/tickets/:id', auth, adminOnly, async (req, res) => {
  const { status, adminNotes, priority } = req.body;
  try {
    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (priority) updates.priority = priority;

    const updated = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (status === 'Resolved') {
      logEmail(updated.email, `Support Ticket #${updated.ticketId} Resolved — CoSoStyle`,
        `Dear ${updated.name},\n\nYour support ticket #${updated.ticketId} has been resolved.\n\nIf you have further questions, email team@cosostyle.com.\n\nCoSoStyle Support Team`
      );
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update ticket.' });
  }
});

// =============================================================================
// SECURE GEMINI AI CHATBOT ROUTE
// =============================================================================

// Rate Limiter for Chatbot to prevent abuse
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages to the AI Fashion Assistant. Please take a short break.' }
});

// Optional auth helper to check if a user is logged in
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'user';
    next();
  } catch (err) {
    next(); // Proceed as guest if token is invalid or expired
  }
};

router.post('/chatbot', chatbotLimiter, optionalAuth, async (req, res) => {
  const { message, history, cart } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    // 1. Fetch user details and recent orders if logged in
    let userDetails = null;
    let recentOrders = [];
    if (req.userEmail) {
      userDetails = await User.findOne({ email: req.userEmail });
      recentOrders = await Order.find({ userEmail: req.userEmail });
    }

    // 2. Fetch all products from the catalog to inject as context
    const products = await Product.find({});
    const condensedCatalog = products.map(p => {
      return `ID: ${p.id} | Title: ${p.title} | Price: ₹${p.price} | Category: ${p.category} | Subcategory: ${p.subcategory || ''} | Color: ${p.color} | Sizes: ${p.sizes.join(', ')} | Material: ${p.material || ''} | Fabric: ${p.fabric || ''} | Occasion: ${p.occasion || ''} | Availability: ${p.availability || 'in-stock'} | Stock: ${p.inventory || 0} | Rating: ${p.rating || 5.0}`;
    }).join('\n');

    // 3. Format context info
    let contextInfo = 'Context info for assistant guidance:\n';
    if (userDetails) {
      contextInfo += `- User: ${userDetails.name} (${userDetails.email}), Loyalty Points: ${userDetails.loyaltyPoints || 0}\n`;
      if (userDetails.addresses && userDetails.addresses.length > 0) {
        contextInfo += `- Shipping Addresses: ${JSON.stringify(userDetails.addresses)}\n`;
      }
    } else {
      contextInfo += `- User: Guest / Not Logged In\n`;
    }

    if (cart && cart.length > 0) {
      const cartStr = cart.map(i => `${i.title} (ID: ${i.id}, Size: ${i.size}, Color: ${i.color}, Qty: ${i.quantity}, Price: ₹${i.price})`).join(', ');
      contextInfo += `- Current Shopping Cart: ${cartStr}\n`;
    } else {
      contextInfo += `- Current Shopping Cart: Empty\n`;
    }

    if (recentOrders && recentOrders.length > 0) {
      // Limit to last 3 orders for context length
      const ordersStr = recentOrders.slice(-3).map(o => `Order ID: ${o._id || o.id} | Date: ${o.date} | Status: ${o.status} | Total: ₹${o.total} | Tracking: ${o.trackingNumber || 'N/A'}`).join('\n  ');
      contextInfo += `- Recent Orders:\n  ${ordersStr}\n`;
    } else if (req.userEmail) {
      contextInfo += `- Recent Orders: No previous orders found\n`;
    }

    // 4. Construct System Prompt
    const SYSTEM_PROMPT = `You are COSO — the AI Fashion Stylist & Virtual Shopping Assistant for CoSoStyle, a premium Indian streetwear brand.
CoSoStyle specializes in heavyweight 240 GSM organic long-staple combed ringspun cotton t-shirts in limited batch runs.

Your Introduction (introduce yourself exactly like this on the welcome/first turn, or if asked):
"Hi 👋
I'm the CoSoStyle AI Fashion Assistant.

I'm here to help you find the perfect outfit, answer product questions, recommend sizes, and assist you throughout your shopping experience."

Your Personality:
- Professional, friendly, helpful, and acting as a fashion expert.
- Passionate about high-quality fabrics, structure, drapes, and streetwear aesthetic.
- Warm, direct, and concise (keep text paragraphs within 3-4 sentences where possible, unless giving detailed lists).
- Speak about Rupees (₹) since CoSoStyle is an Indian brand.

Brand Information & Store Policies:
- Price Range: ₹399 - ₹650.
- Shipping: Free shipping on orders above ₹999. Under ₹999, shipping is ₹99.
- Delivery: Standard delivery takes 3-5 business days across India.
- Returns & Exchanges: 10-day return policy. Items must be unworn, unwashed, in original packaging with tags. Return/Exchange request can be initiated directly from the user's dashboard. Refunds are processed in 3-5 business days.
- Fabric & Wash Care: 100% premium long-staple combed ringspun cotton, heavyweight 240 GSM. Pre-shrunk. Wash cold inside out, hang to dry in shade to maintain color.
- Payments: COD (Cash on Delivery), Cards, UPI (Google Pay, PhonePe, Paytm), Netbanking, and Wallets are accepted.
- Coupons: First order gets 15% off using promo code "COSO15". "COSO10" gives 10% off and "HEAVY20" gives 20% off.
- Support Email: team@cosostyle.com.
- Size Guide Details:
  - S: Chest 38 in, Length 27 in, fits 160-170cm, 55-65kg
  - M: Chest 40 in, Length 28 in, fits 170-178cm, 65-75kg
  - L: Chest 42 in, Length 29 in, fits 178-185cm, 75-85kg
  - XL: Chest 44 in, Length 30 in, fits 185cm+, 85kg+
  - 2XL: Chest 46 in, Length 31 in, fits 185cm+, 85kg+ (oversized look)
  - Reminder: CoSoStyle tees have an intentional boxy, oversized fit. If a customer prefers a standard fit, recommend sizing down.

Product Catalog:
Below is the real-time catalog of all products available on the site:
${condensedCatalog}

When recommending products:
- Recommend actual products from the catalog above. Never hallucinate or recommend products not in the catalog.
- Present their name, price (e.g. ₹399), and description.
- To display a product card, append a \`<products_recommend>[id1, id2, ...]</products_recommend>\` tag at the end of your response listing their product IDs (as a JSON array of numbers). E.g. \`<products_recommend>[1, 2]</products_recommend>\`. This is critical for rendering interactive, clickable cards. Do not put this tag inside markdown code blocks.

Actions & Tool Execution:
If the user's query implies taking an action (like adding a product to the cart, removing from cart, opening the cart drawer, toggling wishlist, searching, or canceling/returning an order), you MUST append a structured JSON block inside a \`<chat_action>JSON_BLOCK</chat_action>\` tag at the very end of your response.
Do not put this tag inside code blocks.

Valid action JSON structures:
1. Add product to cart:
   \`{"action": "ADD_TO_CART", "productId": number, "size": "S"|"M"|"L"|"XL"|"2XL", "color": string, "quantity": number}\`
   (Note: Sizing is required! If size is unknown, ask the user first. Color should match the product in the catalog. Quantity defaults to 1.)
2. Remove product from cart:
   \`{"action": "REMOVE_FROM_CART", "productId": number, "size": string, "color": string}\`
3. Update cart quantity:
   \`{"action": "UPDATE_CART_QUANTITY", "productId": number, "size": string, "color": string, "quantity": number}\`
4. Open cart drawer:
   \`{"action": "OPEN_CART"}\`
5. Add product to wishlist:
   \`{"action": "ADD_TO_WISHLIST", "productId": number}\`
6. Remove product from wishlist:
   \`{"action": "REMOVE_FROM_WISHLIST", "productId": number}\`
7. View / Show wishlist page:
   \`{"action": "SHOW_WISHLIST"}\`
8. Search website catalog:
   \`{"action": "SEARCH", "query": string}\`
   (Trigger this when the user asks to search or browse items, e.g. "show me hoodies", "find oversized shirts".)
9. Navigate to page:
   \`{"action": "NAVIGATE", "path": string}\`
   (Valid paths: "/shop", "/checkout", "/contact", "/about", "/faq", "/dashboard")
10. Cancel order:
   \`{"action": "CANCEL_ORDER", "orderId": string}\`
   (Only trigger if the order exists in the user's recent orders and its status is 'Placed' or 'Processing'.)
11. Return order:
   \`{"action": "RETURN_ORDER", "orderId": string}\`
   (Only trigger if the order exists in the user's recent orders and is 'Delivered'.)

Keep responses engaging, helpful, and fashionable. Ensure XML tags (\`<products_recommend>\` and \`<chat_action>\`) are appended at the end of the text.`;

    // 5. Setup Gemini Connection
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key is missing. Check backend and frontend .env configuration.');
      return res.status(500).json({ message: 'AI configuration is missing. Please contact support.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;

    // Format conversation history for Gemini
    const contents = history ? history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.rawText || msg.text }]
    })) : [];

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: `${contextInfo}\nUser Message: ${message}` }]
    });

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    // 6. Connect to Gemini & stream
    // Setup retry mechanism (up to 2 retries on transient errors)
    let fetchResponse;
    let retries = 2;
    while (retries >= 0) {
      try {
        fetchResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (fetchResponse.ok) break;
        
        const errText = await fetchResponse.text();
        throw new Error(`Gemini API responded with ${fetchResponse.status}: ${errText}`);
      } catch (err) {
        if (retries === 0) throw err;
        console.warn(`Transient Gemini API error, retrying... (${retries} left). Error:`, err.message);
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = fetchResponse.body;
    let buffer = '';
    const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;

    // A fully compatible stream reader that works across all Node versions and web streams
    if (reader && typeof reader.getReader === 'function') {
      const streamReader = reader.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          buffer += chunkStr;
          
          let match;
          let processedIndex = 0;
          while ((match = textRegex.exec(buffer)) !== null) {
            const textVal = match[1];
            try {
              const unescaped = JSON.parse(`"${textVal}"`);
              res.write(`data: ${JSON.stringify({ text: unescaped })}\n\n`);
            } catch (e) {
              textRegex.lastIndex = match.index;
              break;
            }
            processedIndex = textRegex.lastIndex;
          }
          buffer = buffer.substring(processedIndex);
        }
      } finally {
        streamReader.releaseLock();
      }
    } else if (reader) {
      // Fallback for standard node readable stream
      for await (const chunk of reader) {
        buffer += chunk.toString('utf-8');
        let match;
        let processedIndex = 0;
        while ((match = textRegex.exec(buffer)) !== null) {
          const textVal = match[1];
          try {
            const unescaped = JSON.parse(`"${textVal}"`);
            res.write(`data: ${JSON.stringify({ text: unescaped })}\n\n`);
          } catch (e) {
            textRegex.lastIndex = match.index;
            break;
          }
          processedIndex = textRegex.lastIndex;
        }
        buffer = buffer.substring(processedIndex);
      }
    } else {
      throw new Error('Response body reader is not available');
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Error during chatbot interaction:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to communicate with AI Assistant. Please try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'AI Connection lost.' })}\n\n`);
      res.end();
    }
  }
});

export default router;
