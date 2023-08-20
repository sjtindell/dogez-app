import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const bounds = JSON.parse(req.query.bounds);
      const db = await openDb();

      const points = await db.all(
        `SELECT id, latitude, longitude, marker_type, doge_type, cosmetic_type FROM points WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`,
        [bounds._southWest.lat, bounds._northEast.lat, bounds._southWest.lng, bounds._northEast.lng]
      );      

      res.status(200).json({
        "message":"success",
        "data":points
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
