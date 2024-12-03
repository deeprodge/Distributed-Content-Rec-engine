// src/pages/Recommendations.js
import React from "react";
import PostGrid from "../components/PostGrid";

const Recommendations = ({ currentUser }) => {
	return (
		<PostGrid
			currentUser={currentUser}
			apiEndpoint="http://localhost:3001/api/recommendations"
			pageTitle="Recommendations"
		/>
	);
};

export default Recommendations;
