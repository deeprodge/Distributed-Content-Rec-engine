// src/components/Post.js
import React from "react";
import "./Post.css"; // Add styles here or use inline styles

const Post = ({ image, likes, shares, description }) => {
	return (
		<div className="post">
			{/* Display Image */}
			<div className="post-image">
				<img src={image} alt="Post" />
			</div>

			{/* Action Buttons */}
			<div className="post-actions">
				<button className="post-action">
					<i className="fas fa-heart"></i> {likes}
				</button>
				<button className="post-action">
					<i className="fas fa-share"></i> {shares}
				</button>
			</div>

			{/* Description */}
			<div className="post-description">
				<p>{description}</p>
			</div>
		</div>
	);
};

export default Post;
