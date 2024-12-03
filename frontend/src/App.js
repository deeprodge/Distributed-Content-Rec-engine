// src/App.js
import React, { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import Recommendations from "./pages/Recommendations";
import MyProfile from "./pages/MyProfile";
import Login from "./pages/Login";
import { setCurrentUserId, getCurrentUserId } from "./GlobalState";
import "./TabBar.css";

function App() {
	const [currentUser, setCurrentUser] = useState(null);

	const handleLogin = (username) => {
		setCurrentUser(getCurrentUserId());
		// setCurrentUserId(username);
		// console.log("updating current user: ", getCurrentUserId());
		console.log("updating current user: ", currentUser);
		localStorage.setItem("currentUser", username);
	};

	const handleLogout = () => {
		// setCurrentUserId(null); // Clear global user ID
		setCurrentUser(null); // Reset local state
		localStorage.removeItem("currentUser");
	};
	useEffect(() => {
		const storedUser = localStorage.getItem("currentUser");
		if (storedUser) {
			setCurrentUser(storedUser); // Restore state from localStorage
		}
	}, []);
	return (
		<Router>
			{/* {!getCurrentUserId() ? ( */}
			{!currentUser ? (
				<Routes>
					<Route path="/" element={<Login onLogin={handleLogin} />} />
					{/* <Route path="/" element={<Login setCurrentUser={setCurrentUser} />} /> */}
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
