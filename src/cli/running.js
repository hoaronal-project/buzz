'use strict';

const fs = require('fs');
const childProcess = require('child_process');

const fork = require('../meta/debugFork');
const paths = require('./paths');

const dirname = paths.baseDir;

function getRunningPid(callback) {
	fs.readFile(paths.pidfile, {
		encoding: 'utf-8',
	}, function (err, pid) {
		if (err) {
			return callback(err);
		}

		pid = parseInt(pid, 10);

		try {
			process.kill(pid, 0);
			callback(null, pid);
		} catch (e) {
			callback(e);
		}
	});
}

function start(options) {
	if (options.dev) {
		process.env.NODE_ENV = 'development';
		fork(paths.loader, ['--no-daemon', '--no-silent'], {
			env: process.env,
			cwd: dirname,
			stdio: 'inherit',
		});
		return;
	}
	if (options.log) {
		console.log('\n' + [
			'Starting application with logging output'.bold,
			'Hit '.red + 'Ctrl-C '.bold + 'to exit'.red,
			'The Application process will continue to run in the background',
			'Use "' + './node stop'.yellow + '" to stop the Application server',
		].join('\n'));
	} else if (!options.silent) {
		console.log('\n' + [
			'Starting Application'.bold,
			'  "' + './node stop'.yellow + '" to stop the Application server',
			'  "' + './node log'.yellow + '" to view server output',
			'  "' + './node help'.yellow + '" for more commands\n'.reset,
		].join('\n'));
	}

	// Spawn a new Application process
	const child = fork(paths.loader, process.argv.slice(3), {
		env: process.env,
		cwd: dirname,
	});
	if (options.log) {
		childProcess.spawn('tail', ['-F', './logs/output.log'], {
			cwd: dirname,
			stdio: 'inherit',
		});
	}

	return child;
}

function stop() {
	getRunningPid(function (err, pid) {
		if (!err) {
			process.kill(pid, 'SIGTERM');
			console.log('Stopping application. Goodbye!');
		} else {
			console.log('Application is already stopped.');
		}
	});
}

function restart(options) {
	getRunningPid(function (err, pid) {
		if (!err) {
			console.log('\nRestarting application'.bold);
			process.kill(pid, 'SIGTERM');

			options.silent = true;
			start(options);
		} else {
			console.warn('Application could not be restarted, as a running instance could not be found.');
		}
	});
}

function status() {
	getRunningPid(function (err, pid) {
		if (!err) {
			console.log('\n' + [
				'Application Running '.bold + ('(pid ' + pid.toString() + ')').cyan,
				'\t"' + './node stop'.yellow + '" to stop the application server',
				'\t"' + './node log'.yellow + '" to view server output',
				'\t"' + './node restart'.yellow + '" to restart application\n',
			].join('\n'));
		} else {
			console.log('\nApplication is not running'.bold);
			console.log('\t"' + './node start'.yellow + '" to launch the Application server\n'.reset);
		}
	});
}

function log() {
	console.log('\nHit '.red + 'Ctrl-C '.bold + 'to exit\n'.red + '\n'.reset);
	childProcess.spawn('tail', ['-F', './logs/output.log'], {
		cwd: dirname,
		stdio: 'inherit',
	});
}

exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.status = status;
exports.log = log;
