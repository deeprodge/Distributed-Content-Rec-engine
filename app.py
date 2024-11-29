from flask import Flask, jsonify, request
from pymongo import MongoClient
from neo4j import GraphDatabase
import threading

# Flask App Initialization
app = Flask(__name__)

# MongoDB Connection
mongo_client = MongoClient("mongodb://localhost:27017/")  # Connect to MongoDB running in Docker
db = mongo_client["social_media"]

# Neo4j Connection
neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))  # Connect to Neo4j running in Docker

def sync_to_neo4j():
    """
    Synchronizes changes from MongoDB to Neo4j in real-time.
    """
    with db.interactions.watch() as stream:
        print("Listening for changes in MongoDB...")
        for change in stream:
            with neo4j_driver.session() as session:
                if change["operationType"] == "insert":
                    doc = change["fullDocument"]
                    session.run("""
                        MERGE (u:User {id: $user_id})
                        MERGE (c:Content {id: $content_id})
                        MERGE (u)-[:LIKED]->(c)
                    """, user_id=doc["user_id"], content_id=doc["content_id"])

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    API endpoint to calculate PageRank dynamically and return recommendations.
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        with neo4j_driver.session() as session:
            # Dynamically calculate PageRank and get recommendations
            query = """
            CALL gds.pageRank.stream({
                nodeProjection: 'Content',
                relationshipProjection: {
                    LIKED: { type: 'LIKED', orientation: 'REVERSE' }
                }
            })
            YIELD nodeId, score
            MATCH (user:User {id: $user_id})-[:LIKED]->(content:Content)<-[:LIKED]-(similar_user:User)
            WHERE similar_user <> user
            MATCH (similar_user)-[:LIKED]->(recommended_content:Content)
            WHERE NOT (user)-[:LIKED]->(recommended_content) AND id(recommended_content) = nodeId
            RETURN recommended_content.id AS content_id,
                   recommended_content.description AS description,
                   recommended_content.type AS type,
                   score AS page_rank
            ORDER BY page_rank DESC
            LIMIT 10
            """
            result = session.run(query, user_id=user_id)
            recommendations = [
                {
                    "content_id": record["content_id"],
                    "description": record["description"],
                    "type": record["type"],
                    "page_rank": record["page_rank"]
                }
                for record in result
            ]
            return jsonify({"user_id": user_id, "recommendations": recommendations}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Start the synchronization thread
    sync_thread = threading.Thread(target=sync_to_neo4j, daemon=True)
    sync_thread.start()

    # Start Flask server
    app.run(host="0.0.0.0", port=5000, debug=True)
