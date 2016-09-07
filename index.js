var io = require('socket.io-client');
var socket;

var Client = {
	tasks: [],
	options: null,

	defaults: function (options) {
		options.reconnect = options.reconnect || true;

		return options;
	},

	connect: function (options) {
		Client.options = Client.defaults(options);

		socket = io.connect(Client.options.server, {
			reconnect: Client.options.reconnect
		});

		socket = Client.attachHandlers(socket);

		console.log(`Connecting to ${Client.options.server}`);
	},

	attachHandlers: function (socket) {
		socket.on('connect', function () {
			console.log('connected');

			socket.emit("newclient", {
				roles: Client.options.roles,
				tasks: Client.tasks.map((task) => { return task.taskName })
			});
		});

		socket.on('disconnect', function (){
			console.log('disconnect');
		});

		socket.on("manage-newclient", function (config) {
			Client.config = config;

			console.log("New configuration received.");
			console.log(config);
		});

		Client.activateTasks(socket);

		return socket;
	},

	executeTask: function (taskModule) {
		return function (data) {
			taskModule.task(Client.taskLog, Client.taskError, Client.taskClose, data);
		}
	},

	registerTask: function (taskName, task) {
		taskName = `task-${taskName}`;

		console.log(`Registering task: ${taskName}`);

		Client.tasks.push({
			taskName: taskName,
			task: task
		});
	},

	activateTasks: function (socket) {
		Client.tasks.forEach((item) => {
			socket.on(item.taskName, Client.executeTask(item.task));
		});
	},

	taskLog: function (data) {
		socket.emit('input-log', Client.config.name, data);
	},

	taskError: function (error) {
		socket.emit('input-error', Client.config.name, error);
	},

	taskClose: function (statusCode) {
		socket.emit('input-close', Client.config.name, statusCode);
	}
};

module.exports = Client;




