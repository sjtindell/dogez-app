// /api/token-types
import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await openDb();

      const tokens = await db.all(
        `SELECT id, name, type, image_url FROM tokens`
      );      

      res.status(200).json({
        "message":"success",
        "data":tokens
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
