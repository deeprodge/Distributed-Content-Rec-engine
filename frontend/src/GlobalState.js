// src/GlobalState.js

let GlobalState = {
	currentUserId: null, // Default value is null
};

// Function to set the current user ID
export const setCurrentUserId = (userId) => {
	GlobalState.currentUserId = userId;
};

// Function to get the current user ID
export const getCurrentUserId = () => {
	return GlobalState.currentUserId;
};

export default GlobalState;
