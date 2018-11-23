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
		//Pass only if you want to check mongo
		mongo: { db_options: db_options, host: "mongodb://localhost:27017" },
		//Pass only if you want to check redis
		redis_conf: { port: 6379, host: "localhost", password: "abc@123" },
		//Pass only if you want to check api
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
