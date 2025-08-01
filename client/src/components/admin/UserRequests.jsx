import React, { useState } from "react";

function UserRequests() {
	const [requests, setRequests] = useState([
		{
			id: 1,
			name: "Alex Johnson",
			email: "alex@example.com",
			reason:
				"I want to help moderate content and ensure quality education resources",
			experience:
				"2 years in education, currently pursuing M.Sc in Mathematics",
			college: "BHU",
			course: "M.Sc Mathematics",
			requestDate: "2024-07-15",
			status: "pending",
			additionalInfo:
				"I have been using this platform for 2 years and would like to contribute back to the community.",
		},
		{
			id: 2,
			name: "Sarah Wilson",
			email: "sarah.w@student.edu",
			reason:
				"Passionate about helping students access quality educational materials",
			experience: "Teaching assistant for 1 year, Computer Science background",
			college: "NITK",
			course: "B.Tech Computer Science",
			requestDate: "2024-07-14",
			status: "pending",
			additionalInfo:
				"I have experience in content review and quality assurance.",
		},
		{
			id: 3,
			name: "John Doe",
			email: "john.doe@example.com",
			reason: "Want to ensure academic integrity and help fellow students",
			experience: "3 years tutoring experience, Physics PhD student",
			college: "IIT Delhi",
			course: "PhD Physics",
			requestDate: "2024-07-13",
			status: "approved",
			additionalInfo:
				"Experienced in academic content review and plagiarism detection.",
		},
	]);

	const [selectedRequest, setSelectedRequest] = useState(null);
	const [feedback, setFeedback] = useState("");

	const handleApprove = (id, feedbackText = "") => {
		setRequests(
			requests.map((request) =>
				request.id === id
					? { ...request, status: "approved", feedback: feedbackText }
					: request
			)
		);
		setSelectedRequest(null);
		setFeedback("");
	};

	const handleReject = (id, feedbackText) => {
		if (!feedbackText.trim()) {
			alert("Please provide feedback for rejection");
			return;
		}
		setRequests(
			requests.map((request) =>
				request.id === id
					? { ...request, status: "rejected", feedback: feedbackText }
					: request
			)
		);
		setSelectedRequest(null);
		setFeedback("");
	};

	const openReviewModal = (request) => {
		setSelectedRequest(request);
		setFeedback("");
	};

	const pendingRequests = requests.filter((req) => req.status === "pending");
	const processedRequests = requests.filter((req) => req.status !== "pending");

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					👥 User Requests for Moderator (Future Implementation)
				</h2>
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
					<p className="text-blue-800">
						<strong>Note:</strong> This feature allows users to request
						moderator privileges. Only admin (owner) can approve these requests.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
						<h3 className="text-lg font-semibold text-yellow-700">
							Pending Requests
						</h3>
						<p className="text-2xl font-bold text-yellow-800">
							{pendingRequests.length}
						</p>
					</div>
					<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
						<h3 className="text-lg font-semibold text-green-700">
							Approved This Month
						</h3>
						<p className="text-2xl font-bold text-green-800">5</p>
					</div>
					<div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
						<h3 className="text-lg font-semibold text-red-700">
							Rejected This Month
						</h3>
						<p className="text-2xl font-bold text-red-800">2</p>
					</div>
				</div>
			</div>

			{/* Pending Requests */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Pending Requests ({pendingRequests.length})
				</h3>
				<div className="space-y-4">
					{pendingRequests.map((request) => (
						<div
							key={request.id}
							className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
						>
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
								<div className="lg:col-span-2">
									<h4 className="font-semibold text-lg text-gray-800 mb-2">
										{request.name}
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
										<p>
											<strong>Email:</strong> {request.email}
										</p>
										<p>
											<strong>College:</strong> {request.college}
										</p>
										<p>
											<strong>Course:</strong> {request.course}
										</p>
										<p>
											<strong>Request Date:</strong> {request.requestDate}
										</p>
									</div>
									<div className="space-y-2 text-sm">
										<div>
											<strong className="text-gray-700">Reason:</strong>
											<p className="text-gray-600 mt-1">{request.reason}</p>
										</div>
										<div>
											<strong className="text-gray-700">Experience:</strong>
											<p className="text-gray-600 mt-1">{request.experience}</p>
										</div>
										<div>
											<strong className="text-gray-700">
												Additional Information:
											</strong>
											<p className="text-gray-600 mt-1">
												{request.additionalInfo}
											</p>
										</div>
									</div>
								</div>
								<div className="flex flex-col justify-center space-y-2">
									<button
										onClick={() => handleApprove(request.id)}
										className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
									>
										✅ Quick Approve
									</button>
									<button
										onClick={() => openReviewModal(request)}
										className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
									>
										📝 Review with Feedback
									</button>
									<button
										onClick={() => openReviewModal(request)}
										className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
									>
										❌ Reject
									</button>
								</div>
							</div>
						</div>
					))}
					{pendingRequests.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<p className="text-lg">No pending moderator requests</p>
							<p className="text-sm">
								New requests will appear here when users apply for moderator
								privileges
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Processed Requests */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Recent Decisions ({processedRequests.length})
				</h3>
				<div className="space-y-3">
					{processedRequests.map((request) => (
						<div
							key={request.id}
							className="border rounded-lg p-3 bg-gray-50 flex justify-between items-center"
						>
							<div>
								<h5 className="font-medium">{request.name}</h5>
								<p className="text-sm text-gray-600">
									{request.email} • {request.requestDate}
								</p>
							</div>
							<div className="flex items-center space-x-2">
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${
										request.status === "approved"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{request.status.toUpperCase()}
								</span>
								{request.feedback && (
									<button
										className="text-blue-500 hover:text-blue-700"
										title={request.feedback}
									>
										💬
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Review Modal */}
			{selectedRequest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
						<h3 className="text-xl font-bold mb-4">
							Review Moderator Request: {selectedRequest.name}
						</h3>
						<div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
							<p>
								<strong>Email:</strong> {selectedRequest.email}
							</p>
							<p>
								<strong>College:</strong> {selectedRequest.college}
							</p>
							<p>
								<strong>Course:</strong> {selectedRequest.course}
							</p>
							<div>
								<strong>Reason:</strong>
								<p className="mt-1">{selectedRequest.reason}</p>
							</div>
							<div>
								<strong>Experience:</strong>
								<p className="mt-1">{selectedRequest.experience}</p>
							</div>
							<div>
								<strong>Additional Information:</strong>
								<p className="mt-1">{selectedRequest.additionalInfo}</p>
							</div>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Response/Feedback for Applicant:
							</label>
							<textarea
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
								rows="4"
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
								placeholder="Provide feedback, welcome message, or reasons for rejection..."
							/>
						</div>
						<div className="flex space-x-3">
							<button
								onClick={() => handleApprove(selectedRequest.id, feedback)}
								className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
							>
								✅ Approve as Moderator
							</button>
							<button
								onClick={() => handleReject(selectedRequest.id, feedback)}
								className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
							>
								❌ Reject Request
							</button>
							<button
								onClick={() => setSelectedRequest(null)}
								className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Future Implementation Note */}
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<h4 className="font-semibold text-yellow-800 mb-2">
					🚧 Future Implementation Features:
				</h4>
				<ul className="text-sm text-yellow-700 space-y-1">
					<li>• User application form for moderator requests</li>
					<li>• Email notifications for request status updates</li>
					<li>• Background verification checks</li>
					<li>• Automatic role assignment upon approval</li>
					<li>• Moderator onboarding process</li>
				</ul>
			</div>
		</div>
	);
}

export default UserRequests;
