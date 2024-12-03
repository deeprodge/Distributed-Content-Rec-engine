# MongoDB Sharded Cluster with Docker Compose

This project sets up a MongoDB sharded cluster using Docker Compose. It includes:

- A **config server replica set** (`rs_config`) for metadata management.
- Three **shards**, each configured as a replica set (`rs_shard1`, `rs_shard2`, `rs_shard3`).
- A **mongos router** to coordinate queries across the shards.

---

## Features

- **High Availability**: Each shard is a replica set with three nodes.
- **Scalability**: Supports sharding for distributed data storage.
- **Simplified Deployment**: Built using Docker Compose.

---

## Project Structure

```plaintext
