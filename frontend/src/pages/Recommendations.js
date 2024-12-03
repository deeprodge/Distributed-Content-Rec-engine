// src/pages/Recommendations.js
import React from "react";
import PostGrid from "../components/PostGrid";

const Recommendations = () => {
	return (
		<PostGrid
			apiEndpoint="http://localhost:3001/api/recommendations"
			pageTitle="Recommendations"
		/>
	);
};

export default Recommendations;
