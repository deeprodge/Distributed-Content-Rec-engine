// src/components/Post.js
import React, { useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { IoPaperPlaneOutline } from "react-icons/io5";
import "./Post.css";

const Post = ({ 
	image, 
	description, 
	username, 
	interactions,
	comments = [], 
	postId,
	currentUserId 
}) => {
	const [isLiked, setIsLiked] = useState(interactions.hasLiked);
	const [likesCount, setLikesCount] = useState(interactions.likes);
	const [showComments, setShowComments] = useState(false);

	const handleLike = () => {
		if (isLiked) {
			setLikesCount(prev => prev - 1);
		} else {
			setLikesCount(prev => prev + 1);
		}
		setIsLiked(!isLiked);
		// TODO: Add API call to update like status
	};

	return (
		<div className="post-card">
			<div className="post-image-container">
				<img 
					src={image} 
					alt={description} 
					className="post-image"
				/>
			</div>

			<div className="post-actions">
				<div className="action-group">
					<button 
						className={`action-button ${isLiked ? 'liked' : ''}`}
						onClick={handleLike}
					>
						{isLiked ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
					</button>
					<span className="interaction-count">{likesCount}</span>
				</div>

				<div className="action-group">
					<button 
						className="action-button"
						onClick={() => setShowComments(!showComments)}
					>
						<FaRegComment size={22} />
					</button>
					<span className="interaction-count">{interactions.comments}</span>
				</div>

				<div className="action-group">
					<button className="action-button">
						<IoPaperPlaneOutline size={22} />
					</button>
					<span className="interaction-count">{interactions.shares}</span>
				</div>
			</div>

			<div className="post-likes">
				{likesCount} likes
			</div>

			<div className="post-caption">
				<span className="username">{username}</span> {description}
			</div>

			{showComments && (
				<div className="post-comments">
					{comments.length > 0 ? (
						comments.map((comment, index) => (
							<div key={index} className="comment">
								<span className="username">{comment.username}</span> {comment.comment_text}
							</div>
						))
					) : (
						<p className="no-comments">No comments yet.</p>
					)}
					<div className="add-comment">
						<input 
							type="text" 
							placeholder="Add a comment..."
							className="comment-input"
						/>
						<button className="post-button">Post</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Post;
