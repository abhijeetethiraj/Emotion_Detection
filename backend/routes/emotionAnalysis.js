const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

// ==========================================
// MONGODB CONNECTION
// ==========================================
const MONGO_URI = "mongodb+srv://abhijeetethiraj:sakec@cluster0.kalfkcu.mongodb.net/";
const DB_NAME = "emotion_detection_db";

let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// ==========================================
// POST /api/emotions/save
// Save emotion data from Python
// ==========================================
router.post('/save', async (req, res) => {
  try {
    const { userId, email, emotion, confidence, probabilities, timestamp } = req.body;
    
    // Validate input
    if (!userId && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId or email required' 
      });
    }
    
    if (!emotion) {
      return res.status(400).json({ 
        success: false, 
        message: 'emotion data required' 
      });
    }
    
    // Create document
    const document = {
      userId: userId || null,
      email: email || null,
      analysis_type: "emotion_detection",
      result: {
        current_emotion: emotion,
        confidence: confidence,
        probabilities: probabilities,
        timestamp: timestamp || new Date().toISOString()
      },
      createdAt: new Date(),
      model_version: "1.0",
      processed: true
    };
    
    // Save to MongoDB
    const result = await db.collection('analyses').insertOne(document);
    
    console.log(`✅ Saved: ${emotion} (${confidence}%) for ${userId || email}`);
    
    res.json({
      success: true,
      message: 'Emotion data saved',
      documentId: result.insertedId
    });
    
  } catch (error) {
    console.error('❌ Error saving:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save',
      error: error.message 
    });
  }
});

// ==========================================
// GET /api/emotions/users
// Get all unique users
// ==========================================
router.get('/users', async (req, res) => {
  try {
    // Get distinct users from database
    const users = await db.collection('analyses').aggregate([
      {
        $group: {
          _id: "$userId",
          email: { $first: "$email" },
          totalAnalyses: { $sum: 1 },
          lastSeen: { $max: "$createdAt" }
        }
      },
      {
        $project: {
          userId: "$_id",
          email: 1,
          totalAnalyses: 1,
          lastSeen: 1
        }
      },
      { $sort: { lastSeen: -1 } }
    ]).toArray();

    res.json({
      success: true,
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ==========================================
// GET /api/emotions/history
// Get emotion history for a user
// Query params: userId OR email, limit (default 100)
// ==========================================
router.get('/history', async (req, res) => {
  try {
    const { userId, email, limit = 100 } = req.query;
    
    // Build query - either userId or email
    let query = {};
    if (userId && userId !== 'undefined' && userId !== 'null') {
      query.userId = userId;
    } else if (email) {
      query.email = email;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'userId or email required' 
      });
    }

    // Fetch from MongoDB, sorted by newest first
    const analyses = await db.collection('analyses')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      count: analyses.length,
      data: analyses
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch history' 
    });
  }
});

// ==========================================
// GET /api/emotions/stats
// Get aggregated statistics for a user
// Query params: userId OR email
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const { userId, email } = req.query;
    
    // Build query
    let query = {};
    if (userId && userId !== 'undefined' && userId !== 'null') {
      query.userId = userId;
    } else if (email) {
      query.email = email;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'userId or email required' 
      });
    }

    // Count total analyses
    const totalCount = await db.collection('analyses').countDocuments(query);

    // Aggregate emotion distribution
    const emotionStats = await db.collection('analyses').aggregate([
      { $match: query },
      { 
        $group: {
          _id: "$result.current_emotion",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$result.confidence" }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get most recent analysis
    const recentAnalysis = await db.collection('analyses')
      .findOne(query, { sort: { createdAt: -1 } });

    // Format response
    res.json({
      success: true,
      totalAnalyses: totalCount,
      emotionDistribution: emotionStats.map(stat => ({
        emotion: stat._id,
        count: stat.count,
        percentage: ((stat.count / totalCount) * 100).toFixed(1),
        avgConfidence: stat.avgConfidence ? stat.avgConfidence.toFixed(1) : 0
      })),
      mostRecentEmotion: recentAnalysis?.result?.current_emotion || null,
      lastAnalysisDate: recentAnalysis?.createdAt || null
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

// ==========================================
// GET /api/emotions/global-stats
// Get statistics across ALL users
// ==========================================
router.get('/global-stats', async (req, res) => {
  try {
    // Total count across all users
    const totalCount = await db.collection('analyses').countDocuments();

    // Emotion distribution globally
    const emotionStats = await db.collection('analyses').aggregate([
      { 
        $group: {
          _id: "$result.current_emotion",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$result.confidence" }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Count unique users
    const uniqueUsers = await db.collection('analyses').distinct('userId');

    res.json({
      success: true,
      totalAnalyses: totalCount,
      totalUsers: uniqueUsers.length,
      emotionDistribution: emotionStats.map(stat => ({
        emotion: stat._id,
        count: stat.count,
        percentage: ((stat.count / totalCount) * 100).toFixed(1),
        avgConfidence: stat.avgConfidence ? stat.avgConfidence.toFixed(1) : 0
      }))
    });

  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch global statistics' 
    });
  }
});

// ==========================================
// GET /api/emotions/timeline
// Get daily emotion counts over time
// Query params: userId OR email, days (default 7)
// ==========================================
router.get('/timeline', async (req, res) => {
  try {
    const { userId, email, days = 7 } = req.query;
    
    // Build query
    let query = {};
    if (userId && userId !== 'undefined' && userId !== 'null') {
      query.userId = userId;
    } else if (email) {
      query.email = email;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'userId or email required' 
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    query.createdAt = { $gte: startDate, $lte: endDate };

    // Aggregate by day
    const timeline = await db.collection('analyses').aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            emotion: "$result.current_emotion"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]).toArray();

    // Format for frontend
    const formattedData = {};
    timeline.forEach(item => {
      const date = item._id.date;
      const emotion = item._id.emotion;
      
      if (!formattedData[date]) {
        formattedData[date] = { date };
      }
      formattedData[date][emotion] = item.count;
    });

    res.json({
      success: true,
      data: Object.values(formattedData)
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch timeline' 
    });
  }
});

// ==========================================
// DELETE /api/emotions/clear
// Clear all data for a user (for testing)
// ==========================================
router.delete('/clear', async (req, res) => {
  try {
    const { userId, email } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    else if (email) query.email = email;
    else {
      return res.status(400).json({ error: 'userId or email required' });
    }

    const result = await db.collection('analyses').deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} records`
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

module.exports = router;