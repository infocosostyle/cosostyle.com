import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'coso_secret_token_100_percent_cotton';

export const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'user';
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden. Admin role required.' });
  }
  next();
};
