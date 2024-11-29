// src/pages/PostGrid.js
import React, { useState, useEffect } from "react";
import Post from "../components/Post"; // Import the Post component
import "./PostGrid.css"; // Add styles for grid layout

const PostGrid = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch posts from API
	useEffect(() => {
		const fetchPosts = async () => {
			try {
				// const response = await fetch("/recommendations?user_id=user_001"); // Replace with dynamic user_id
				// if (!response.ok) {
				// 	throw new Error("Failed to fetch posts.");
				// }
				// const data = await response.json();
				const data = [
					{
						_id: "content_001",
						description: "Exploring the best coffee spots in San Francisco!",
						type: "Image",
						tags: ["Coffee", "Travel", "Foodie"],
						created_by: "user_001",
						created_at: "2024-11-01T12:00:00",
					},
					{
						_id: "content_002",
						description:
							"Hiking through the Grand Canyon. The views are unreal!",
						type: "Video",
						tags: ["Travel", "Adventure", "Nature"],
						created_by: "user_002",
						created_at: "2024-11-01T12:05:00",
					},
					{
						_id: "content_003",
						description:
							"Trying my hand at watercolor painting. What do you think?",
						type: "Image",
						tags: ["Art", "Hobby", "Creative"],
						created_by: "user_003",
						created_at: "2024-11-01T12:10:00",
					},
					{
						_id: "content_004",
						description: "Sunday brunch vibes with the squad. 🍳🥂",
						type: "Image",
						tags: ["Food", "Lifestyle", "Friends"],
						created_by: "user_004",
						created_at: "2024-11-01T12:15:00",
					},
					{
						_id: "content_005",
						description: "Morning yoga sessions at the beach. Feeling zen. 🌊",
						type: "Video",
						tags: ["Health", "Fitness", "Beach"],
						created_by: "user_005",
						created_at: "2024-11-01T12:20:00",
					},
					{
						_id: "content_006",
						description:
							"Backpacking through the Rockies. Who's in for the next trip?",
						type: "Video",
						tags: ["Travel", "Adventure", "Nature"],
						created_by: "user_006",
						created_at: "2024-11-01T12:25:00",
					},
					{
						_id: "content_007",
						description: "Spicing up my home with DIY plant holders. 🪴",
						type: "Image",
						tags: ["DIY", "Lifestyle", "HomeDecor"],
						created_by: "user_007",
						created_at: "2024-11-01T12:30:00",
					},
					{
						_id: "content_008",
						description:
							"Baking brownies from scratch. Kitchen experiments are fun!",
						type: "Video",
						tags: ["Food", "Baking", "Dessert"],
						created_by: "user_008",
						created_at: "2024-11-01T12:35:00",
					},
					{
						_id: "content_009",
						description: "Caught this amazing sunset in Austin yesterday. 🌅",
						type: "Image",
						tags: ["Nature", "Photography", "Sunset"],
						created_by: "user_009",
						created_at: "2024-11-01T12:40:00",
					},
					{
						_id: "content_010",
						description: "Celebrating Diwali with family and lights. 🪔",
						type: "Image",
						tags: ["Festival", "Family", "Tradition"],
						created_by: "user_010",
						created_at: "2024-11-01T12:45:00",
					},
					{
						_id: "content_011",
						description: "Reviewing my favorite books of the year. 📚",
						type: "Image",
						tags: ["Books", "Review", "Hobby"],
						created_by: "user_001",
						created_at: "2024-11-01T12:50:00",
					},
					{
						_id: "content_012",
						description: "Visited the Louvre. Art and history galore!",
						type: "Image",
						tags: ["Travel", "Art", "History"],
						created_by: "user_002",
						created_at: "2024-11-01T12:55:00",
					},
					{
						_id: "content_013",
						description: "Late-night coding session. Debugging never ends. 💻",
						type: "Image",
						tags: ["Tech", "Programming", "Hustle"],
						created_by: "user_003",
						created_at: "2024-11-01T13:00:00",
					},
					{
						_id: "content_014",
						description: "Unboxing my new gaming setup. 🎮",
						type: "Video",
						tags: ["Gaming", "Tech", "Unboxing"],
						created_by: "user_004",
						created_at: "2024-11-01T13:05:00",
					},
					{
						_id: "content_015",
						description: "Attended a salsa dance workshop. 💃🕺",
						type: "Video",
						tags: ["Dance", "Workshop", "Fun"],
						created_by: "user_005",
						created_at: "2024-11-01T13:10:00",
					},
				];

				// Log data to verify
				console.log(data);
				setPosts(data);
				// setPosts(data.recommendations);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchPosts();
	}, []);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	return (
		<div className="post-grid">
			{posts.map((post, index) => (
				<Post
					key={index}
					image={`https://via.placeholder.com/300`} // Replace with `post.image` when image URLs are available
					likes={Math.floor(Math.random() * 100)} // Simulated like count
					shares={Math.floor(Math.random() * 50)} // Simulated share count
					description={post.description}
				/>
			))}
		</div>
	);
};

export default PostGrid;
