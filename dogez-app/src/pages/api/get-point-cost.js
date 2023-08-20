import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const db = await openDb();

      const point = await db.get(
        `SELECT cost FROM points WHERE id = ?`,
        [id]
      );

      if (point) {
        res.status(200).json({ cost: point.cost });
      } else {
        res.status(404).json({ message: 'Point not found' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
