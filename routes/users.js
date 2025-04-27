import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// ✅ Fetch all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// ✅ Promote user to Admin
router.put('/:id/promote', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: true }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to promote user' });
  }
});

// ✅ Demote user from Admin
router.put('/:id/demote', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: false }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to demote user' });
  }
});

// ✅ Deactivate user
router.put('/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

// ✅ Reactivate user (FIXED!)
router.put('/:id/reactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Error reactivating user:', err);
    res.status(500).json({ message: 'Failed to reactivate user' });
  }
});

// ✅ Delete a user (FIXED URL)
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
