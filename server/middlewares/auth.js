// middlewares/auth.js
import { verifyToken } from '@clerk/backend';

const secretKey = process.env.CLERK_SECRET_KEY;

export const authenticateClerkUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token, { secretKey });

    req.user = {
      id: payload.sub,
      email: payload.email_address,
      ...payload,
    };

    console.log('Authenticated user:', req.user);

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
