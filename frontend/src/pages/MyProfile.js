// src/pages/MyProfile.js
import React from "react";
import PostGrid from "../components/PostGrid";

const MyProfile = () => {
	return (
		<PostGrid
			apiEndpoint="http://localhost:3001/api/myprofile"
			pageTitle="My Profile"
		/>
	);
};

export default MyProfile;
