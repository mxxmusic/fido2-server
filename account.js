var Waterline = require("waterline");
var sailsMemoryAdapter = require("sails-memory");
var async = require("async");
var uuid = require("node-uuid");

module.exports = ServerAccount;

function ServerAccount(opts, cb) {}

ServerAccount.prototype.init = function(server) {
	return new Promise(function(resolve, reject) {
		var waterline = new Waterline();

		var waterlineConfig = {
			adapters: {
				"memory": sailsMemoryAdapter
			},

			connections: {
				default: {
					adapter: "memory"
				}
			}
		};

		var userCollection = Waterline.Collection.extend({
			identity: "user",
			connection: "default",
			attributes: { // TODO
				firstName: "string",
				lastName: "string",
				id: { // account name, email, etc.
					type: "string",
					primaryKey: true,
					unique: true,
					required: true
				},
				guid: {
					type: "text",
					unique: true,
					defaultsTo: function() {
						return uuid.v4();
					}
				},
				imageUrl: "string",
				attestation: "string",
				lastAttestationUpdate: "datetime",
				otherInfo: "json",

				// Add a reference to Pets
				credentials: {
					collection: "credential",
					via: "user"
				}
			},
			beforeUpdate: function(values, next) {
				console.log("updating:", values);
				if (values.attestation !== undefined) {
					values.lastAttestationUpdate = new Date();
				}
				console.log("updating:", values);
				next();
			}
		});

		var credentialCollection = Waterline.Collection.extend({
			identity: "credential",
			connection: "default",
			attributes: {
				type: "string",
				id: {
					type: "integer",
					autoIncrement: true,
					unique: true,
					primaryKey: true,
					required: true,
					index: true
				},

				// Add a reference to User
				user: {
					model: "user"
				}
			}
		});

		waterline.loadCollection(userCollection);
		waterline.loadCollection(credentialCollection);

		waterline.initialize(waterlineConfig, function(err, ontology) {

			if (err) {
				console.log("Error in waterline init: " + err);
				// TODO: audit warn
				return reject(err);
			}

			this.waterline = waterline;
			this.user = ontology.collections.user;
			this.credential = ontology.collections.credential;

			return resolve(this);
		}.bind(this));
	}.bind(this));
};

ServerAccount.prototype.shutdown = function() {
	return new Promise(function(resolve, reject) {
		this.waterline.teardown(function(err, res) {
			if (err) {
				console.log("Waterline shutdown failed");
				reject(err);
			}

			resolve(res);
		});
	}.bind(this));
};

ServerAccount.prototype.listUsers = function() {
	return this.user.find().populate("credentials");
};

ServerAccount.prototype.findOrCreateUser = function(id, userInfo) {
	console.log("findOrCreateUser");
	if (typeof id !== "string") {
		return Promise.reject(new TypeError("id required when creating user"));
	}

	userInfo = userInfo || {};

	var user = {
		id: id,
		firstName: userInfo.firstName,
		lastName: userInfo.lastName,
		otherInfo: userInfo.otherInfo
	};
	console.log ("findOrCreate:", user);
	return this.user.findOrCreate({id: id}, user);
};

ServerAccount.prototype.getUserByGuid = function(guid) {
	return this.user
		.findOne()
		.where({
			guid: guid
		}).populate("credentials");
};

ServerAccount.prototype.getUserById = function(id) {
	return this.user
		.findOne()
		.where({
			id: id
		})
		.populate("credentials");
};

ServerAccount.prototype.updateUserAttestation = function(id, attestation) {
	if (typeof id !== "string") {
		return Promise.reject (new TypeError ("updateUserAttestation expected id to be string"));
	}

	console.log (attestation);
	if (typeof attestation !== "string" ||
		attestation.length < 8) {
		return Promise.reject (new TypeError ("updateUserAttestation expected attestation to be string at least 8 characters long"));
	}


	return this.user
		.update({
			id: id
		}, {
			attestation: attestation
		});
};

ServerAccount.prototype.updateUser = function() {

};

ServerAccount.prototype.deleteUser = function() {

};

ServerAccount.prototype.listCredentials = function() {

};

ServerAccount.prototype.createCredential = function() {

};

ServerAccount.prototype.getCredential = function() {

};

ServerAccount.prototype.updateCredential = function() {

};

ServerAccount.prototype.deleteCredential = function() {

};