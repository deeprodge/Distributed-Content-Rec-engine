// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PostGrid from "./pages/PostGrid";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<PostGrid />} />
			</Routes>
		</Router>
	);
}

export default App;
