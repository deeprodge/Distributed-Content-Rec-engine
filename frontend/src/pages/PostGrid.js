// src/pages/PostGrid.js
import React, { useState, useEffect } from "react";
import Post from "../components/Post"; // Import the Post component
import "./PostGrid.css"; // Add styles for grid layout

const PostGrid = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentUser, setCurrentUser] = useState('user_001');

	// Actual users data
	const users = [
		{
			"_id": "user_001",
			"name": "Aarav Mehta",
		},
		{
			"_id": "user_002",
			"name": "Zara Patel",
		},
		{
			"_id": "user_003",
			"name": "Rohan Gupta",
		},
		{
			"_id": "user_004",
			"name": "Leena Shah",
		},
		{
			"_id": "user_005",
			"name": "Kabir Singh",
		},
		{
			"_id": "user_006",
			"name": "Maya Iyer",
		},
		{
			"_id": "user_007",
			"name": "Vivaan Kapoor",
		},
		{
			"_id": "user_008",
			"name": "Anika Verma",
		},
		{
			"_id": "user_009",
			"name": "Aryan Desai",
		},
		{
			"_id": "user_010",
			"name": "Ishita Roy",
		}
	];

	// Function to get user name from user ID
	const getUserName = (userId) => {
		const user = users.find(u => u._id === userId);
		return user ? user.name : userId; // Return userId if name not found
	};

	// Fetch posts when current user changes
	useEffect(() => {
		const fetchPosts = async () => {
			try {
				setLoading(true);
				const response = await fetch('http://localhost:3001/api/recommendations', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						userId: currentUser
					})
				});

				if (!response.ok) {
					throw new Error('Failed to fetch posts');
				}

				const data = await response.json();
				// Limit to 9 posts and add user names
				const enrichedPosts = data.slice(0, 9).map(post => ({
					...post,
					userName: getUserName(post.user_id),
					interactions: {
						likes: post.interactions.likes || 0,
						comments: post.interactions.comments || 0,
						shares: post.interactions.shares || 0,
						hasLiked: post.interactions.hasLiked || false
					},
					comments: post.comments || []
				}));
				setPosts(enrichedPosts);
				setLoading(false);
			} catch (err) {
				setError(err.message);
				setLoading(false);
			}
		};

		fetchPosts();
	}, [currentUser]); // Refetch when user changes

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="loading">Error: {error}</div>;

	return (
		<div className="page-container">
			{/* User Selector */}
			<div className="user-selector">
				<label htmlFor="user-select">Viewing as: </label>
				<select 
					id="user-select"
					value={currentUser}
					onChange={(e) => setCurrentUser(e.target.value)}
				>
					{users.map(user => (
						<option key={user._id} value={user._id}>
							{user.name}
						</option>
					))}
				</select>
			</div>

			{/* Posts Grid */}
			<div className="post-grid">
				{posts.map((post, index) => (
					<Post
						key={post._id || index}
						postId={post._id}
						image={post.image ? `data:image/jpeg;base64,${post.image}` : '/placeholder-image.jpg'}
						description={post.description}
						username={post.userName}
						interactions={post.interactions}
						comments={post.comments}
						currentUserId={currentUser}
					/>
				))}
			</div>
		</div>
	);
};

export default PostGrid;
