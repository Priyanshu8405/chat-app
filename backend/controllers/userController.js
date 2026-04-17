const User = require('../models/User');

// @desc    Get all users except current user
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ online: -1, name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Search users by name or email
// @route   GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

module.exports = { getUsers, searchUsers };
