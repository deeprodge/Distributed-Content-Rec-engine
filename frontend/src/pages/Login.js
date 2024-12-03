// src/pages/Login.js
import React, { useState } from "react";
import "./Login.css";
import { setCurrentUserId } from "../GlobalState";

const Login = ({ onLogin }) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = () => {
		if (username.trim()) {
			console.log(username);
			setCurrentUserId(username); // Set the global user ID
			onLogin(username); // Trigger the parent component's login logic
		} else {
			alert("Please enter a valid username.");
		}
	};

	return (
		<div className="login-container">
			<h1>Login</h1>
			<input
				type="text"
				placeholder="Enter your username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className="login-input"
			/>
			<input
				type="password"
				placeholder="Enter your password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className="login-input"
			/>
			<button onClick={handleLogin} className="login-button">
				Login
			</button>
		</div>
	);
};

export default Login;
