const express = require("express");
const { MongoClient } = require("mongodb");
const neo4j = require("neo4j-driver");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const mongoUrl = "mongodb://localhost:27017/mydb";
const neo4jUrl = "bolt://127.0.0.1:7687";
const neo4jUser = "neo4j";
const neo4jPassword = "DiscoDeewaneS";

let mongoClient = null;
const driver = neo4j.driver(
	neo4jUrl,
	neo4j.auth.basic(neo4jUser, neo4jPassword)
);

//for synchrinizing mongodb and neo4j real time
async function setupChangeStream() {
	try {
		const client = await connectToMongo();
		const db = client.db("mydb");

		// Watch the 'interactions' collection
		const interactionsChangeStream = db.collection("interactions").watch();
		interactionsChangeStream.on("change", async (change) => {
			console.log("Change detected in interactions collection:", change);
			await handleInteractionChange(change);
		});

		console.log("Change streams set up for users and interactions collections");
	} catch (error) {
		console.error("Error setting up change streams:", error);
	}
}

async function handleInteractionChange(change) {
	const session = driver.session();
	try {
		if (change.operationType === "insert") {
			const { user_id, content_id, interaction_type } = change.fullDocument;
			console.log(
				"Interaction inserted:",
				user_id,
				content_id,
				interaction_type
			);
			await session.run(
				`
                MATCH (u:User {id: $userId}), (c:Content {id: $contentId})
                MERGE (u)-[r:INTERACTED {type: $type}]->(c)
            `,
				{ userId: user_id, contentId: content_id, type: interaction_type }
			);
		} else if (change.operationType === "delete") {
			const { documentKey } = change;
			console.log("Interaction deleted:", documentKey._id);
			await session.run(
				`
                MATCH ()-[r:INTERACTED]->() 
                WHERE r.id = $id
                DELETE r
            `,
				{ id: documentKey._id }
			);
		}
	} catch (error) {
		console.error("Error handling interaction change:", error);
	} finally {
		session.close();
	}
}

// Initialize MongoDB connection
async function connectToMongo() {
	try {
		if (!mongoClient) {
			mongoClient = await MongoClient.connect(mongoUrl, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
			console.log("MongoDB connected successfully");

			// Test the connection by listing collections
			const db = mongoClient.db("mydb");
			const collections = await db.listCollections().toArray();
			console.log(
				"Available collections:",
				collections.map((c) => c.name)
			);
		}
		return mongoClient;
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
}

app.post("/api/recommendations", async (req, res) => {
	console.log("Received recommendation request for userId:", req.body.userId);
	const { userId } = req.body;
	let session = null;

	try {
		// First get recommendations from Neo4j
		session = driver.session();
		// const neoResult = await session.run(`
		//     MATCH (u:User {id: $userId})-[r1:INTERACTED]->(c1:Content)
		//     MATCH (c1)<-[r2:INTERACTED]-(other:User)
		//     MATCH (other)-[r3:INTERACTED]->(c2:Content)
		//     WHERE NOT (u)-[:INTERACTED]->(c2)
		//     WITH c2, COUNT(*) as commonInteractions
		//     ORDER BY commonInteractions DESC
		//     RETURN c2.id as contentId
		//     LIMIT 10
		// `, { userId });

		const neoResult = await session.run(
                    `
            MATCH (u:User {id: $userId})-[r1:INTERACTED]->(c1:Content)
            MATCH (c1)<-[r2:INTERACTED]-(other:User)
            MATCH (other)-[r3:INTERACTED]->(c2:Content)
            WHERE NOT (u)-[:INTERACTED]->(c2)
            
            // Match tags for both the interacted and recommended content
            MATCH (c1)-[:HAS_TAG]->(tag:Tag)<-[:HAS_TAG]-(c2)
            
            // Count common interactions and tag matches
            WITH c2, COUNT(DISTINCT tag) AS commonTags, COUNT(DISTINCT other) AS commonInteractions
            ORDER BY commonTags DESC, commonInteractions DESC
            RETURN c2.id AS contentId
            LIMIT 10
            `,
			{ userId }
		);

		// Extract content IDs from Neo4j result
		const recommendedContentIds = neoResult.records.map((record) =>
			record.get("contentId")
		);
		console.log("Recommended content IDs:", recommendedContentIds);

		// Connect to MongoDB
		const client = await connectToMongo();
		const db = client.db("mydb");

		// Fetch content with images
		const contents = await db
			.collection("content")
			.find(
				recommendedContentIds.length > 0
					? { _id: { $in: recommendedContentIds } }
					: {}
			)
			.limit(10)
			.toArray();

		const contentIds = contents.map((content) => content._id);

		// Get all unique user IDs from contents and comments
		const userIds = new Set(contents.map((content) => content.user_id));

		// Fetch all users in one query
		const users = await db
			.collection("users")
			.find({ _id: { $in: Array.from(userIds) } })
			.toArray();

		// Create a map of user IDs to names
		const userNameMap = users.reduce((acc, user) => {
			acc[user._id] = user.name;
			return acc;
		}, {});

		// Fetch images
		const images = await db
			.collection("images")
			.find({ _id: { $in: contentIds } })
			.toArray();

		// Get interaction counts
		const interactions = await db
			.collection("interactions")
			.aggregate([
				{
					$match: {
						content_id: { $in: contentIds },
					},
				},
				{
					$group: {
						_id: "$content_id",
						likes: {
							$sum: { $cond: [{ $eq: ["$interaction_type", "like"] }, 1, 0] },
						},
						comments: {
							$sum: {
								$cond: [{ $eq: ["$interaction_type", "comment"] }, 1, 0],
							},
						},
						shares: {
							$sum: { $cond: [{ $eq: ["$interaction_type", "share"] }, 1, 0] },
						},
					},
				},
			])
			.toArray();

		// Get user's likes
		const userLikes = await db
			.collection("interactions")
			.find({
				user_id: userId,
				content_id: { $in: contentIds },
				interaction_type: "like",
			})
			.toArray();

		const userLikedContentIds = new Set(
			userLikes.map((like) => like.content_id)
		);

		// Get comments and their user details
		const comments = await db
			.collection("interactions")
			.find({
				content_id: { $in: contentIds },
				interaction_type: "comment",
			})
			.toArray();

		// Get additional user IDs from comments
		const commentUserIds = new Set(comments.map((comment) => comment.user_id));

		// Fetch comment users
		const commentUsers = await db
			.collection("users")
			.find({ _id: { $in: Array.from(commentUserIds) } })
			.toArray();

		// Add comment users to the name map
		commentUsers.forEach((user) => {
			userNameMap[user._id] = user.name;
		});

		// Group comments by content_id with user names
		const commentsByContent = comments.reduce((acc, comment) => {
			if (!acc[comment.content_id]) {
				acc[comment.content_id] = [];
			}
			acc[comment.content_id].push({
				username: userNameMap[comment.user_id] || "Unknown User",
				comment_text: comment.comment_text,
				timestamp: comment.timestamp,
			});
			return acc;
		}, {});

		// Combine all data
		const enrichedContent = contents.map((content) => {
			const contentId = content._id;
			const interactionData = interactions.find((i) => i._id === contentId) || {
				likes: 0,
				comments: 0,
				shares: 0,
			};

			return {
				...content,
				username: userNameMap[content.user_id] || "Unknown User", // Add poster's name
				image: images.find((img) => img._id === contentId)?.image || null,
				interactions: {
					...interactionData,
					hasLiked: userLikedContentIds.has(contentId),
				},
				comments: commentsByContent[contentId] || [],
			};
		});

		// Sort the enriched content to match Neo4j recommendation order
		if (recommendedContentIds.length > 0) {
			enrichedContent.sort((a, b) => {
				return (
					recommendedContentIds.indexOf(a._id) -
					recommendedContentIds.indexOf(b._id)
				);
			});
		}

		console.log(
			"Sending response with enriched content count:",
			enrichedContent.length
		);
		res.json(enrichedContent);
	} catch (error) {
		console.error("Error in /api/recommendations:", error);
		res.status(500).json({
			error: error.message,
			stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
		});
	} finally {
		if (session) {
			session.close();
		}
	}
});

// Add this new endpoint for handling likes
app.post("/api/like", async (req, res) => {
	const { userId, contentId, isLiking } = req.body;
	let session = null;

	console.log(
		`Like request received - User: ${userId}, Content: ${contentId}, Action: ${
			isLiking ? "liking" : "unliking"
		}`
	);

	try {
		// Connect to MongoDB
		const client = await connectToMongo();
		const db = client.db("mydb");

		if (isLiking) {
			// Add like to MongoDB
			await db.collection("interactions").insertOne({
				_id: `interaction_${Date.now()}`,
				user_id: userId,
				content_id: contentId,
				interaction_type: "like",
				timestamp: new Date().toISOString(),
			});
			console.log("✅ MongoDB: Like added successfully");

			// Add relationship to Neo4j
			// session = driver.session();
			// await session.run(`
			//     MATCH (u:User {id: $userId})
			//     MATCH (c:Content {id: $contentId})
			//     MERGE (u)-[r:INTERACTED]->(c)
			//     RETURN r
			// `, { userId, contentId });
			// console.log('✅ Neo4j: Relationship added successfully');
		} else {
			// Remove like from MongoDB
			const result = await db.collection("interactions").deleteOne({
				user_id: userId,
				content_id: contentId,
				interaction_type: "like",
			});
			console.log(
				"✅ MongoDB: Like removed successfully",
				result.deletedCount ? "(1 document deleted)" : "(no document found)"
			);

			// Remove relationship from Neo4j
			// session = driver.session();
			// const neoResult = await session.run(`
			//     MATCH (u:User {id: $userId})-[r:INTERACTED]->(c:Content {id: $contentId})
			//     DELETE r
			//     RETURN count(r) as deletedCount
			// `, { userId, contentId });
			// console.log('✅ Neo4j: Relationship removed successfully',
			//     neoResult.records[0].get('deletedCount') ? '(relationship deleted)' : '(no relationship found)');
		}

		console.log("👍 Like operation completed successfully");
		res.json({ success: true });
	} catch (error) {
		console.error("❌ Error in /api/like:", error);
		console.error("Failed operation details:", {
			userId,
			contentId,
			action: isLiking ? "like" : "unlike",
			timestamp: new Date().toISOString(),
		});
		res.status(500).json({
			error: error.message,
			stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
		});
	} finally {
		if (session) {
			session.close();
			console.log("Neo4j session closed");
		}
	}
});

// Test connections on startup
async function testConnections() {
	try {
		await connectToMongo();
		const session = driver.session();
		await session.run("RETURN 1");
		console.log("Neo4j connected successfully");
		session.close();
	} catch (error) {
		console.error("Connection test failed:", error);
	}
}

// testConnections();
testConnections().then(() => {
	setupChangeStream();
});

app.listen(3001, () => {
	console.log("Server running on port 3001");
});

// Handle process termination
process.on("SIGINT", async () => {
	console.log("Shutting down...");
	if (mongoClient) {
		await mongoClient.close();
	}
	await driver.close();
	process.exit(0);
});
