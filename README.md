# Purpose

A simple, identity-less, decentralized forum protocol, based on the OrbitDB framework.

# Design

OrbitDB, a decentralized database backed by IPFS, is used as the main database for storing threads and comments. OrbitDB runs both on and server and in the browser. In the browser, each user has their own separate local copy of the database. If other databases are discovered with the same address, either on other browsers or on a server, OrbitDB will replicate that database locally. To prevent database "merge conflicts", OrbitDB is write-only. Thus, the forum is also write-only.

The main database is currently set up as public access, for both reads and writes, meaning anyone can view and post. We have no identification system in place, so anyone can post as anyone else. Given the constraints of OrbitDB's access policies, we'd ideally do identity using an external solution, such as an identity blockchain, and in a modular fashion to allow plugging in different providers. This identity component still needs to be designed and implemented.

The forum itself has two components:

* A server, which replicates all content from peers and "pins" it, persisting the contents and providing a source for the data. Note that any user can run a server for a particular forum. In theory, every user with a stake in the community could have their own persistent forum server to ensure the forum remains accessible.

* A client, which represents the main user interface to the forum. This includes a local database, which is replicated to and from a server in a bidirectional fashion. The client would also interface with the chosen identity provider.

# Usage

Running the server: `yarn server`

Running the client: `yarn client`

# Development Status

Posting threads and comments is tentatively working, at least locally. Server replication does not work as of yet, and will be implemented alongside address (forum) selection. Identity is on hold until the other aspects are stable.