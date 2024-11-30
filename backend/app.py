from flask import Flask, jsonify, request
from pymongo import MongoClient
from neo4j import GraphDatabase
import threading
from PIL import Image
import io
import base64
from flask_cors import CORS
import traceback

# Flask App Initialization
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB Connection
mongo_client = MongoClient("mongodb://localhost:27017/")
db = mongo_client["mydb"]

# Neo4j Connection
neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "DiscoDeewaneS"))

def sync_to_neo4j():
    """
    Synchronizes changes from MongoDB to Neo4j in real-time.
    """
    # with db.interactions.watch() as stream:
    #     print("Listening for changes in MongoDB...")
    #     for change in stream:
    #         with neo4j_driver.session() as session:
    #             if change["operationType"] == "insert":
    #                 doc = change["fullDocument"]
    #                 session.run("""
    #                     MERGE (u:User {id: $user_id})
    #                     MERGE (c:Content {id: $content_id})
    #                     MERGE (u)-[:LIKED]->(c)
    #                 """, user_id=doc["user_id"], content_id=doc["content_id"])

def process_image(base64_image):
    """
    Process image to be square using PIL
    """
    try:
        # Decode base64 to bytes
        image_data = base64.b64decode(base64_image)
        
        # Open image with PIL
        with Image.open(io.BytesIO(image_data)) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate dimensions for square crop
            size = 500
            # Resize and crop to square
            img.thumbnail((size, size))
            
            # If image is not square, crop it
            if img.size[0] != img.size[1]:
                thumb = img.crop((0, 0, size, size))
            else:
                thumb = img
            
            # Save to bytes
            buffer = io.BytesIO()
            thumb.save(buffer, format='JPEG')
            
            # Convert back to base64
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None


@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    try:
        user_id = request.json.get('userId')
        print(f'Received recommendation request for userId: {user_id}')

        # Fetch content
        contents = list(db.content.find({}).limit(10))
        
        # Get content IDs
        content_ids = [content['_id'] for content in contents]
        
        # Fetch images
        images = list(db.images.find({'_id': {'$in': content_ids}}))
        
        # Fetch interaction counts
        pipeline = [
            {'$match': {'content_id': {'$in': content_ids}}},
            {'$group': {
                '_id': '$content_id',
                'likes': {
                    '$sum': {'$cond': [{'$eq': ['$interaction_type', 'like']}, 1, 0]}
                },
                'shares': {
                    '$sum': {'$cond': [{'$eq': ['$interaction_type', 'share']}, 1, 0]}
                }
            }}
        ]
        interactions = list(db.interactions.aggregate(pipeline))

        # Process and combine all data
        enriched_content = []
        for content in contents:
            # Find corresponding image and process it
            image_doc = next((img for img in images if img['_id'] == content['_id']), None)
            processed_image = None
            if image_doc and 'image' in image_doc:
                processed_image = process_image(image_doc['image'])

            # Find interaction counts
            interaction_data = next(
                (inter for inter in interactions if inter['_id'] == content['_id']),
                {'likes': 0, 'shares': 0}
            )

            # Convert ObjectId to string for JSON serialization
            content['_id'] = str(content['_id'])
            
            enriched_content.append({
                **content,
                'image': processed_image,
                'interactions': {
                    'likes': interaction_data['likes'],
                    'shares': interaction_data['shares']
                }
            })

        print(f'Sending response with enriched content count: {len(enriched_content)}')
        return jsonify(enriched_content)

    except Exception as e:
        print(f"Error in /api/recommendations: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'stack': traceback.format_exc() if app.debug else None
        }), 500

if __name__ == "__main__":
    print("Server starting on http://localhost:3001")
    app.run(
        host="0.0.0.0",  # This allows external connections
        port=3001,       # Matches the port in your frontend code
        debug=True       # Enable debug mode for development
    )
