// Simple in-memory SSE event bus per user
// NOTE: This uses process memory; suitable for single-instance deployments.
// For multi-instance, replace with Redis pub/sub or similar.

const clients = new Map(); // userId(string) -> Set<res>

function addClient(userId, res) {
	const key = String(userId);
	if (!clients.has(key)) clients.set(key, new Set());
	clients.get(key).add(res);
}

function removeClient(userId, res) {
	const key = String(userId);
	const set = clients.get(key);
	if (!set) return;
	set.delete(res);
	if (set.size === 0) clients.delete(key);
}

function sendToUser(userId, event, data) {
	const key = String(userId);
	const set = clients.get(key);
	if (!set || set.size === 0) return;
	const payload = typeof data === "string" ? data : JSON.stringify(data || {});
	for (const res of set) {
		try {
			res.write(`event: ${event}\n`);
			res.write(`data: ${payload}\n\n`);
		} catch (_) {
			// ignore broken pipe; connection cleanup happens on 'close'
		}
	}
}

function sendToUsers(userIds, event, data) {
	if (!Array.isArray(userIds) || userIds.length === 0) return;
	for (const uid of userIds) sendToUser(uid, event, data);
}

export default {
	addClient,
	removeClient,
	sendToUser,
	sendToUsers,
};
