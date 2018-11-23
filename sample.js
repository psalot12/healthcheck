const express = require("express");
const app = express();
app.listen(9098, function() {
	console.log(`listining on port 9098`);
});
const HealthChecker = require("./healthcheck");
try {
	let db_options = {
		dbName: "notifications",
		autoIndex: true,
		poolSize: 5,
		user: "admin",
		pass: "abc123",
		auth: { authdb: "admin" }
	};

	// init_mongoose().then(data => {
	let handlers = {
		mongo: { db_options: db_options, host: "mongodb://localhost:27017" },
		redis_conf: { port: 6379, host: "localhost", password: "abc@123" },
		api: {
			url: "https://api.com/api",
			method: "get",
			headers: {
				Authorization: "eyJ0eXAiOiJKV1QiLCJhbGciO"
			}
		}
	};
	let healthCheck = new HealthChecker(app, handlers);
	healthCheck.Initiate();
	// });
} catch (e) {
	console.log(e);
}
