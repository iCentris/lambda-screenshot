var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
var fs = require('fs');
var http = require('http');

exports.handler = function (event, context, callback) {
  var args = event.Records[0].Sns.MessageAttributes,
      key = args.Key.Value;

  // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
  process.env['PATH'] += ':' + process.env['LAMBDA_TASK_ROOT'];

  // Set the path to the phantomjs binary
  var phantomPath = path.join(__dirname, 'phantomjs_linux-x86_64');

  var target = '/tmp/' + key;
  //console.log('Preview Ecard URL:', args.Url.Value);

  // Arguments for the phantom script
  var processArgs = [
    '--ssl-protocol=any',
    '--ignore-ssl-errors=true',
    '--disk-cache=true',
    path.join(__dirname, 'phantom-script.js'),
    args.Url.Value,
    target
  ];

  // Launch the child process
  childProcess.execFile(phantomPath, processArgs, {}, function (error, stdout, stderr) {
    if (error) {
      callback(error);
      return;
    }
    if (stderr) {
      callback(error);
      return;
    }
    //console.log(stdout);

    //upload the file to s3
    new AWS.S3().upload({
      Bucket: args.Bucket.Value,
      Key: key,
      ContentType: args.ContentType.Value
      Body: fs.createReadStream(target)
    }, function (err) {
      // delete the file
      fs.unlink(target, function(err2) {
        if (err) {
          callback(err);
        } else {
          // signal done to aws
          callback(null, 'Done!');
        }
      });

      if(args.CallbackUrl){
        http.get(args.CallbackUrl.Value);
      }
    });
  });
}
