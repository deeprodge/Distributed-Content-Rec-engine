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
				console.log('Fetching posts...');
				const response = await fetch('http://localhost:3001/api/recommendations', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						userId: 'user_001'
					})
				});

				console.log('Response status:', response.status);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(`Failed to fetch posts: ${errorData.error || response.statusText}`);
				}

				const data = await response.json();
				console.log('Received data:', data);
				setPosts(data);
				setLoading(false);
			} catch (err) {
				console.error('Error fetching posts:', err);
				setError(err.message);
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
					key={post._id || index}
					image={post.image ? `data:image/jpeg;base64,${post.image}` : '/placeholder-image.jpg'}
					likes={post.interactions.likes}
					shares={post.interactions.shares}
					description={post.description}
				/>
			))}
		</div>
	);
};

export default PostGrid;
