const express = require('express');
const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUrl = "mongodb://localhost:27017/mydb";
const neo4jUrl = 'bolt://127.0.0.1:7687';
const neo4jUser = 'neo4j';
const neo4jPassword = 'DiscoDeewaneS';

let mongoClient = null;
const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic(neo4jUser, neo4jPassword));

// Initialize MongoDB connection
async function connectToMongo() {
    try {
        if (!mongoClient) {
            mongoClient = await MongoClient.connect(mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected successfully');
            
            // Test the connection by listing collections
            const db = mongoClient.db('mydb');
            const collections = await db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));
        }
        return mongoClient;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

app.post('/api/recommendations', async (req, res) => {
    console.log('Received recommendation request for userId:', req.body.userId);
    const { userId } = req.body;
    let session = null;
    
    try {
        // First get recommendations from Neo4j
        session = driver.session();
        const neoResult = await session.run(`
            MATCH (u:User {id: $userId})-[r1:INTERACTED]->(c1:Content)
            MATCH (c1)<-[r2:INTERACTED]-(other:User)
            MATCH (other)-[r3:INTERACTED]->(c2:Content)
            WHERE NOT (u)-[:INTERACTED]->(c2)
            WITH c2, COUNT(*) as commonInteractions
            ORDER BY commonInteractions DESC
            RETURN c2.id as contentId
            LIMIT 10
        `, { userId });

        // Extract content IDs from Neo4j result
        const recommendedContentIds = neoResult.records.map(record => record.get('contentId'));
        console.log('Recommended content IDs:', recommendedContentIds);

        // If no recommendations, fall back to latest content
        const contentIdsToFetch = recommendedContentIds.length > 0 
            ? recommendedContentIds 
            : null;

        // Connect to MongoDB
        const client = await connectToMongo();
        const db = client.db('mydb');
        
        // Fetch content with images
        console.log('Fetching content and images from MongoDB...');
        const contents = await db.collection('content')
            .find(contentIdsToFetch ? { _id: { $in: contentIdsToFetch } } : {})
            .limit(10)
            .toArray();
        
        // Fetch corresponding images
        const contentIds = contents.map(content => content._id);
        const images = await db.collection('images')
            .find({ _id: { $in: contentIds } })
            .toArray();
        
        // Get interaction counts
        const interactions = await db.collection('interactions')
            .aggregate([
                { $match: { content_id: { $in: contentIds } }},
                { $group: {
                    _id: '$content_id',
                    likes: { 
                        $sum: { $cond: [{ $eq: ['$interaction_type', 'like'] }, 1, 0] }
                    },
                    shares: {
                        $sum: { $cond: [{ $eq: ['$interaction_type', 'share'] }, 1, 0] }
                    }
                }}
            ]).toArray();

        // Combine all data
        const enrichedContent = contents.map(content => ({
            ...content,
            image: images.find(img => img._id === content._id)?.image || null,
            interactions: interactions.find(i => i._id === content._id) || { likes: 0, shares: 0 }
        }));

        // Sort the enriched content to match Neo4j recommendation order
        if (contentIdsToFetch) {
            enrichedContent.sort((a, b) => {
                return contentIdsToFetch.indexOf(a._id) - contentIdsToFetch.indexOf(b._id);
            });
        }

        console.log('Sending response with enriched content count:', enrichedContent.length);
        res.json(enrichedContent);
        
    } catch (error) {
        console.error('Error in /api/recommendations:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) {
            session.close();
        }
    }
});

// Test connections on startup
async function testConnections() {
    try {
        await connectToMongo();
        const session = driver.session();
        await session.run('RETURN 1');
        console.log('Neo4j connected successfully');
        session.close();
    } catch (error) {
        console.error('Connection test failed:', error);
    }
}

testConnections();

app.listen(3001, () => {
    console.log('Server running on port 3001');
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (mongoClient) {
        await mongoClient.close();
    }
    await driver.close();
    process.exit(0);
}); 