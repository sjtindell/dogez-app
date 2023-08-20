// /api/get-token-id
import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { doge_type, cosmetic_type } = req.query;

      const db = await openDb();
      let token;
      if (doge_type) {
        token = await db.get(
          `SELECT id FROM tokens WHERE name = ?`,
          [doge_type]
        );
      } else if (cosmetic_type) {
        token = await db.get(
          `SELECT id FROM tokens WHERE name = ?`,
          [cosmetic_type]
        );
      }

      if (token) {
        res.status(200).json({ data: { token_id: token.id } });
      } else {
        res.status(404).json({ message: 'Token not found' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
