// src/App.js
import React, { useState } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import Recommendations from "./pages/Recommendations";
import MyProfile from "./pages/MyProfile";
import Login from "./pages/Login";
import { setCurrentUserId } from "./GlobalState";
import "./TabBar.css";

function App() {
	const [currentUser, setCurrentUser] = useState(null);

	const handleLogin = (username) => {
		setCurrentUser(username);
	};

	const handleLogout = () => {
		setCurrentUserId(null); // Clear global user ID
		setCurrentUser(null); // Reset local state
	};

	return (
		<Router>
			{!currentUser ? (
				<Routes>
					<Route path="/" element={<Login onLogin={handleLogin} />} />
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			) : (
				<div>
					<nav className="tab-bar">
						<a href="/recommendations">Recommendations</a>
						<a href="/myprofile">My Profile</a>
						<button className="logout-button" onClick={handleLogout}>
							Logout
						</button>
					</nav>
					<Routes>
						<Route
							path="/recommendations"
							element={<Recommendations currentUser={currentUser} />}
						/>
						<Route
							path="/myprofile"
							element={<MyProfile currentUser={currentUser} />}
						/>
						<Route path="*" element={<Navigate to="/recommendations" />} />
					</Routes>
				</div>
			)}
		</Router>
	);
}

export default App;
