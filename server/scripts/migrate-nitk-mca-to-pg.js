/*
 Migration: Move NITK MCA files from nitk/mca/* to nitk/PG/mca/* in S3 and update MongoDB s3Key references.
 - No app code changes. Safe, resumable, and supports dry-run.
 - Handles both approved (college-notes/...) and pending (pending/...) prefixes.

 Usage (Windows cmd):
   set DRY_RUN=true && node scripts/migrate-nitk-mca-to-pg.js
   set DRY_RUN=false && node scripts/migrate-nitk-mca-to-pg.js

 Env required:
   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME
   MONGODB_URI
*/

import AWS from "aws-sdk";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Allow CLI override: --no-dry-run (force execute) or --dry-run (force simulate)
const argv = process.argv.slice(2);
const cliForceDry = argv.includes("--dry-run");
const cliForceNoDry = argv.includes("--no-dry-run");

// Normalize env value
const envDry = (process.env.DRY_RUN ?? "true").toString().trim().toLowerCase();
let DRY_RUN = envDry !== "false";
if (cliForceDry) DRY_RUN = true;
if (cliForceNoDry) DRY_RUN = false;
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const MONGODB_URI = process.env.MONGODB_URI;

if (!BUCKET) {
	console.error("❌ AWS_S3_BUCKET_NAME is not set.");
	process.exit(1);
}
if (!MONGODB_URI) {
	console.error("❌ MONGODB_URI is not set.");
	process.exit(1);
}

AWS.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Prefix pairs to migrate
const PREFIX_PAIRS = [
	{ from: "college-notes/nitk/mca/", to: "college-notes/nitk/PG/mca/" },
	{ from: "pending/nitk/mca/", to: "pending/nitk/PG/mca/" },
];

// Utility to list all objects under a prefix (handles pagination)
async function listAllKeys(prefix) {
	const all = [];
	let ContinuationToken = undefined;
	do {
		const res = await s3
			.listObjectsV2({
				Bucket: BUCKET,
				Prefix: prefix,
				ContinuationToken,
				MaxKeys: 1000,
			})
			.promise();
		(res.Contents || []).forEach((obj) => {
			if (obj.Key && !obj.Key.endsWith("/")) all.push(obj.Key);
		});
		ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
	} while (ContinuationToken);
	return all;
}

async function copyThenDelete(oldKey, newKey) {
	// If destination already exists, skip copy/delete for safety (idempotent)
	try {
		await s3.headObject({ Bucket: BUCKET, Key: newKey }).promise();
		console.log(`⏭️  Skip: destination exists ${newKey}`);
		return { success: true, skipped: true };
	} catch (e) {
		// Not found -> proceed
	}

	if (DRY_RUN) {
		console.log(`DRY-RUN: Would COPY ${oldKey} -> ${newKey}`);
		return { success: true, dryRun: true };
	}
	// Copy
	await s3
		.copyObject({
			Bucket: BUCKET,
			CopySource: encodeURIComponent(`${BUCKET}/${oldKey}`),
			Key: newKey,
			MetadataDirective: "COPY",
		})
		.promise();
	// Delete old
	await s3.deleteObject({ Bucket: BUCKET, Key: oldKey }).promise();
	console.log(`✅ Moved: ${oldKey} -> ${newKey}`);
	return { success: true };
}

async function migrateS3() {
	const mapping = new Map(); // oldKey -> newKey
	for (const { from, to } of PREFIX_PAIRS) {
		const keys = await listAllKeys(from);
		console.log(`📦 Found ${keys.length} objects under ${from}`);
		for (const oldKey of keys) {
			const newKey = oldKey.replace(from, to);
			await copyThenDelete(oldKey, newKey);
			mapping.set(oldKey, newKey);
		}
	}
	return mapping;
}

// Minimal Note model (inline) for update; matches server/models/noteModel.js fields we need
const noteSchema = new mongoose.Schema(
	{
		college: String,
		course: String,
		programLevel: { type: String, default: "" },
		file: {
			s3Key: String,
			s3Bucket: String,
		},
		status: String,
	},
	{ collection: "notes" }
);
const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

async function migrateMongo(mapping) {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		let updatedCount = 0;
		// Pre-check: how many docs still contain /nitk/mca/
		const preCount = await Note.countDocuments({
			"file.s3Key": { $regex: /\/nitk\/mca\//i },
		});
		console.log(`🔎 Pre-update docs with /nitk/mca/: ${preCount}`);

		for (const [oldKey, newKey] of mapping.entries()) {
			// Update only docs exactly matching the oldKey
			const res = await Note.updateMany(
				{ "file.s3Key": oldKey },
				{ $set: { "file.s3Key": newKey, programLevel: "PG" } },
				{ session }
			);
			if (res.modifiedCount) {
				updatedCount += res.modifiedCount;
				console.log(`🗃️  Updated ${res.modifiedCount} docs for ${oldKey}`);
			}
		}

		// Also handle any docs that still contain /nitk/mca/ but didn't match exact keys (defensive)
		const regex = /(college-notes|pending)\/nitk\/mca\//i;
		let pipelineSupported = true;
		try {
			const bulk = await Note.updateMany(
				{ "file.s3Key": { $regex: regex } },
				[
					{
						$set: {
							programLevel: "PG",
							"file.s3Key": {
								$replaceOne: {
									input: "$file.s3Key",
									find: "/nitk/mca/",
									replacement: "/nitk/PG/mca/",
								},
							},
						},
					},
				],
				{ session }
			);
			if (bulk.modifiedCount) {
				updatedCount += bulk.modifiedCount;
				console.log(`🛠️  Regex-updated ${bulk.modifiedCount} additional docs`);
			}
		} catch (e) {
			pipelineSupported = false;
			console.warn(
				"⚠️  Pipeline update not supported; falling back to bulkWrite.",
				e?.message
			);
		}

		if (!pipelineSupported) {
			const cursor = Note.find(
				{ "file.s3Key": { $regex: regex } },
				{ _id: 1, "file.s3Key": 1 }
			).cursor();
			const ops = [];
			for await (const doc of cursor) {
				const old = doc.file?.s3Key || "";
				const replacement = old.replace("/nitk/mca/", "/nitk/PG/mca/");
				if (old !== replacement) {
					ops.push({
						updateOne: {
							filter: { _id: doc._id },
							update: {
								$set: { "file.s3Key": replacement, programLevel: "PG" },
							},
						},
					});
					if (ops.length >= 500) {
						const res = await Note.bulkWrite(ops, { session });
						updatedCount += res.modifiedCount || 0;
						ops.length = 0;
					}
				}
			}
			if (ops.length) {
				const res = await Note.bulkWrite(ops, { session });
				updatedCount += res.modifiedCount || 0;
			}
			console.log(`🧰 Fallback bulkWrite updated docs: ${updatedCount}`);
		}

		if (DRY_RUN) {
			console.log(
				"DRY-RUN: Would commit transaction with updates; rolling back."
			);
			await session.abortTransaction();
		} else {
			await session.commitTransaction();
			console.log(
				`✅ MongoDB updates committed. Total docs updated: ${updatedCount}`
			);
		}
	} catch (err) {
		console.error("❌ Mongo migration failed:", err);
		await session.abortTransaction();
		throw err;
	} finally {
		session.endSession();
	}
}

// Fallback: scan all collections for file.s3Key matches and update
async function scanAllCollectionsAndUpdate() {
	const db = mongoose.connection.db;
	const collections = await db.collections();
	let total = 0;
	for (const coll of collections) {
		try {
			// Quick existence check of field
			const count = await coll.countDocuments({
				"file.s3Key": { $regex: /\/nitk\/mca\//i },
			});
			if (!count) continue;
			console.log(
				`🧭 Collection ${coll.collectionName}: ${count} docs to update`
			);
			// Attempt pipeline update
			try {
				const res = await coll.updateMany(
					{ "file.s3Key": { $regex: /\/nitk\/mca\//i } },
					[
						{
							$set: {
								programLevel: "PG",
								"file.s3Key": {
									$replaceOne: {
										input: "$file.s3Key",
										find: "/nitk/mca/",
										replacement: "/nitk/PG/mca/",
									},
								},
							},
						},
					]
				);
				total += res.modifiedCount || 0;
				console.log(`   ↳ Pipeline updated ${res.modifiedCount || 0}`);
			} catch (e) {
				console.log(
					`   ↳ Pipeline unsupported; iterating documents. Reason: ${e.message}`
				);
				const cursor = coll.find(
					{ "file.s3Key": { $regex: /\/nitk\/mca\//i } },
					{ projection: { file: 1 } }
				);
				const bulkOps = [];
				while (await cursor.hasNext()) {
					const doc = await cursor.next();
					const old = doc?.file?.s3Key || "";
					const replacement = old.replace("/nitk/mca/", "/nitk/PG/mca/");
					if (old !== replacement) {
						bulkOps.push({
							updateOne: {
								filter: { _id: doc._id },
								update: {
									$set: { "file.s3Key": replacement, programLevel: "PG" },
								},
							},
						});
					}
					if (bulkOps.length >= 500) {
						const res2 = await coll.bulkWrite(bulkOps);
						total += res2.modifiedCount || 0;
						bulkOps.length = 0;
					}
				}
				if (bulkOps.length) {
					const res2 = await coll.bulkWrite(bulkOps);
					total += res2.modifiedCount || 0;
				}
			}
		} catch (err) {
			// Skip system or incompatible collections
			if (!/system\./.test(coll.collectionName)) {
				console.warn(`⚠️  Skipping ${coll.collectionName}:`, err.message);
			}
		}
	}
	console.log(
		`📊 scan-all summary: modified ${total} docs across collections.`
	);
}

async function main() {
	console.log("🚀 Starting NITK MCA -> PG migration", {
		bucket: BUCKET,
		DRY_RUN,
		envDry,
		argv,
	});

	// Connect Mongo first so we fail fast if URI invalid
	await mongoose.connect(MONGODB_URI, {
		serverSelectionTimeoutMS: 15000,
	});
	console.log("✅ Connected to MongoDB");

	// Diagnostics: show sample MCA docs
	try {
		const sample = await mongoose.connection.db
			.collection("notes")
			.find(
				{ college: "nitk", course: /mca/i },
				{
					projection: {
						_id: 1,
						status: 1,
						course: 1,
						college: 1,
						"file.s3Key": 1,
					},
				}
			)
			.limit(5)
			.toArray();
		console.log(
			"🧪 Sample MCA docs (first 5):",
			sample.map((d) => ({
				_id: d._id,
				status: d.status,
				s3Key: d?.file?.s3Key,
			}))
		);
	} catch (e) {
		console.warn("⚠️  Unable to fetch sample MCA docs:", e.message);
	}

	const SKIP_S3 = argv.includes("--skip-s3") || argv.includes("--mongo-only");
	let mapping = new Map();
	if (!SKIP_S3) {
		// Phase 1: S3 move
		mapping = await migrateS3();
		console.log(`📈 S3 migration prepared for ${mapping.size} objects`);
	} else {
		console.log("⏭️  Skipping S3 move (mongo-only mode)");
	}

	// Phase 2: Mongo updates
	await migrateMongo(mapping);

	// If some views still show old keys, run broad fallback (optional flag)
	if (argv.includes("--scan-all")) {
		await scanAllCollectionsAndUpdate();
	}

	await mongoose.disconnect();
	console.log("🏁 Migration complete.");
}

main().catch(async (e) => {
	console.error("Migration error:", e);
	try {
		await mongoose.disconnect();
	} catch {}
	process.exit(1);
});
