// /api/get-point-image
import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const id = req.query.id;
      const db = await openDb();

      const point = await db.get(
        `SELECT tokens.image_url 
         FROM points 
         JOIN tokens ON 
           (points.marker_type = 'doge' AND points.doge_type = tokens.name) OR 
           (points.marker_type = 'chest' AND points.cosmetic_type = tokens.name) 
         WHERE points.id = ?`,
        [id]
      );     

      res.status(200).json({
        "message":"success",
        "data":point
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
