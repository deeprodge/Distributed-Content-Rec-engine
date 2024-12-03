// src/App.js
import React, { useState } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import PostGrid from "./pages/PostGrid";
import Login from "./pages/Login";
import { setCurrentUserId } from "./GlobalState";

function App() {
	const [currentUser, setCurrentUser] = useState(null);

	const handleLogin = (username) => {
		setCurrentUser(username);
	};

	const handleLogout = () => {
		setCurrentUserId(null); // Clear the global user ID
		setCurrentUser(null); // Reset local state
	};

	return (
		<Router>
			<Routes>
				{!currentUser ? (
					<Route path="/" element={<Login onLogin={handleLogin} />} />
				) : (
					<Route path="/" element={<PostGrid onLogout={handleLogout} />} />
				)}
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</Router>
	);
}

export default App;
