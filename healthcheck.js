const async = require("async");
const express = require("express");
const mongoose = require("mongoose");
const Promise = require("bluebird");
const redis = require("redis");
const request = require("request-promise");

class HealthChecker {
	/*
    handler{
    pg: handler,
    redis: handler
    }
     */

	constructor(server, handlers) {
		this.server = server;
		this.handlers = handlers;
		if (this.handlers) {
			let { pg: pg, redis: redis_conf } = this.handlers;
			let mongo = this.handlers.mongo;
			let redisdb = this.handlers.redis_conf;
			let apidata = this.handlers.api;
			this.functions = [];

			if (redisdb) {
				let redisfunction = () => {
					return new Promise((resolve, reject) => {
						let count = 0;
						let error;
						const redisClient = redis
							.createClient(this.handlers.redis_conf)
							.on("error", function(err) {
								let errorObj = {
									error: true,
									message: "Redis instance is not responsive",
									errorObj: err
								};
								reject(errorObj);
							});
						redisClient.ping(function(err, pong) {
							if (err || pong !== "PONG") {
								let errorObj = {
									error: true,
									message: "Instance is not responsive"
								};
								reject(errorObj);
							} else {
								resolve({ redis: "Successfully pinged redis" });

								redisClient.end(true);
							}
						});
					});
				};
				this.functions.push(redisfunction);
			}

			if (mongo) {
				const mongofunction = () => {
					return new Promise((resolve, reject) => {
						try {
							mongoose.connect(
								mongo.host,
								mongo.db_options,
								(err, data) => {
									let errorObj = {
										error: true,
										message: "Mongodb connection error"
									};
									if (err) {
										errorObj["message"] = err.message;
										reject(errorObj);
									}
									if (data && data.readyState === 1) {
										resolve({ mongo: "Mongo Connected Successfully" });
									} else {
										reject(errorObj);
									}
									mongoose.connection.close();
								}
							);
						} catch (e) {
							reject(e);
						}
					});
				};

				this.functions.push(mongofunction);
			}
			if (apidata) {
				let apifunction = () => {
					return new Promise((resolve, reject) => {
						if (apidata.method.toLowerCase() == "get") {
							request
								.get(apidata)
								.then(body => {
									resolve({ apiresponse: body });
								})
								.catch(err => {
									let errorObj = { error: true, message: err };

									reject(errorObj);
								});
						} else {
							request
								.post(apidata)
								.then(body => {
									resolve({ apiresponse: body });
								})
								.catch(err => {
									let errorObj = { error: true, message: err };
									reject(err);
								});
						}
					});
				};
				this.functions.push(apifunction);
			}
		}
	}

	Initiate() {
		if (this.server) {
			let app = this.server;
			app.get("/healthcheck", (req, res, next) => {
				this.Check()
					.then(result => {
						res.status(200);
						res.send(result);
					})
					.catch(err => {
						res.status(500).send(err);
					});
			});
		} else {
			throw new Error("Cannot initiate the health check!");
		}
	}

	Check(cb) {
		try {
			let allChecks = this.functions;
			return Promise.all(
				allChecks.map(data => {
					return data();
				})
			)
				.then(apiresponse => {
					return apiresponse;
				})
				.catch(err => {
					throw err;
				});
		} catch (e) {
			return e;
		}
	}
}

module.exports = HealthChecker;
