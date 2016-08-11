var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

/********** CONFIGS **********/

var PHANTOM_BINARY = 'phantomjs_linux-x86_64';

/********** HELPERS **********/

var save_to_s3 = function(payload, bucket, key, callback) {
  var param = {
    Bucket: bucket,
    Key: key,
    ContentType: 'image/png',
    Body: payload};
  s3.upload(param, function(err, data) {
    if (err) {
      callback(err);
    } else {
      callback(null, 'Done!');
    }
  });
};

/********** MAIN **********/

exports.handler = function(event, context, callback) {
	var args = event.Records[0].Sns.MessageAttributes;

	// Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
	process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
	
	// Set the path to the phantomjs binary
	var phantomPath = path.join(__dirname, PHANTOM_BINARY);

	// Arguments for the phantom script
	var processArgs = [ '--ssl-protocol=any',
		                '--ignore-ssl-errors=true',
		                '--disk-cache=true',
		                path.join(__dirname, 'phantom-script.js'),
		                args.Url.Value ];

	// Launch the child process
	childProcess.execFile(phantomPath, processArgs, {maxBuffer: 1024 * 5000}, function(error, stdout, stderr) {
		if (error) {
			callback(error);
			return;
		}
		if (stderr) {
			callback(error);
			return;
		}

        // Decode base64 string that comes back from the child process
		var buffer = new Buffer(stdout, 'base64')

		save_to_s3(buffer, args.Bucket.Value, args.Key.Value, callback);
	});
}