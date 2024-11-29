import random
import datetime
import json

# Define users, content, interaction types, and sample comments
users = [f"user_{str(i).zfill(3)}" for i in range(1, 11)]
contents = [f"content_{str(i).zfill(3)}" for i in range(1, 61)]
interaction_types = ["like", "comment", "share"]
comments = [
    "Great post!", "Loved it!", "Amazing content!", "Nice one!", "Informative!",
    "Keep it up!", "Very inspiring!", "Good vibes!", "Great visuals!", "Interesting!",
    "Super cool!", "Thanks for sharing!", "This made my day!", "So relatable!",
    "Fantastic shot!", "This is brilliant!", "Well done!", "Simply awesome!",
    "Wow, just wow!", "Couldn’t agree more!"
]

# Function to generate random timestamps
def random_timestamp(start, end):
    start_time = datetime.datetime.strptime(start, "%Y-%m-%dT%H:%M:%S")
    end_time = datetime.datetime.strptime(end, "%Y-%m-%dT%H:%M:%S")
    random_time = start_time + (end_time - start_time) * random.random()
    return random_time.strftime("%Y-%m-%dT%H:%M:%S")

# Generate random interactions
def generate_interactions(n):
    interactions = []
    for i in range(1, n + 1):
        user_id = random.choice(users)
        content_id = random.choice(contents)
        interaction_type = random.choice(interaction_types)
        timestamp = random_timestamp("2024-11-01T12:00:00", "2024-11-01T17:00:00")
        comment_text = random.choice(comments) if interaction_type == "comment" else None

        interaction = {
            "_id": f"interaction_{str(i).zfill(3)}",
            "user_id": user_id,
            "content_id": content_id,
            "interaction_type": interaction_type,
            "timestamp": timestamp
        }

        if comment_text:  # Add comment_text only for "comment" interactions
            interaction["comment_text"] = comment_text

        interactions.append(interaction)
    return interactions

# Generate 50 random interactions
interaction_data = generate_interactions(1000)

# Save to interactions.json
with open("interactions.json", "w") as file:
    json.dump(interaction_data, file, indent=2)

print("Interaction data saved to interactions.json!")
