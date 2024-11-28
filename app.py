from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

app = Flask(__name__)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")  # Replace with your connection URI
db = client["social_media"]  # Replace with your database name

@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    try:
        # Step 1: Get the user_id from the request
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "Missing user_id in request"}), 400

        # Step 2: Fetch posts the user has already interacted with
        user_interactions = db.interactions.find({"user_id": user_id})
        interacted_content_ids = {interaction["content_id"] for interaction in user_interactions}

        # Step 3: Find users who have interacted with the same posts
        similar_users_cursor = db.interactions.find({
            "content_id": {"$in": list(interacted_content_ids)},
            "user_id": {"$ne": user_id}  # Exclude the current user
        })

        similar_user_ids = {interaction["user_id"] for interaction in similar_users_cursor}

        # Step 4: Fetch content interacted by similar users that the current user hasn't seen
        recommended_interactions = db.interactions.find({
            "user_id": {"$in": list(similar_user_ids)},
            "content_id": {"$nin": list(interacted_content_ids)}
        })

        # Get content IDs from these interactions
        recommended_content_ids = {interaction["content_id"] for interaction in recommended_interactions}

        # Step 5: Fetch details about the recommended content
        recommended_content = db.content.find({
            "_id": {"$in": list(recommended_content_ids)}
        })

        # Step 6: Rank the content by popularity (e.g., number of interactions or custom score)
        ranked_content = []
        for content in recommended_content:
            content_id = content["_id"]
            interaction_count = db.interactions.count_documents({"content_id": content_id})
            ranked_content.append({
                "content_id": content_id,
                "description": content["description"],
                "tags": content.get("tags", []),
                "type": content.get("type", ""),
                "created_by": content.get("created_by", ""),
                "interaction_count": interaction_count
            })

        # Sort content by interaction count (descending)
        ranked_content = sorted(ranked_content, key=lambda x: x["interaction_count"], reverse=True)

        # Step 7: Return JSON response
        return jsonify({"user_id": user_id, "recommendations": ranked_content}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
