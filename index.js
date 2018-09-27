var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
var fs = require('fs');
var request = require('request');

exports.handler = function (event, context, callback) {
  var args = event.Records[0].Sns.MessageAttributes;
  console.log("Start", args);
  var key = args.Key.Value;
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


  var callbackUrlOptions = {};

  if(args.CallbackUrl) {
    callbackUrlOptions = {
      url: args.CallbackUrl.Value,
      method: 'GET',
      qs: {}
    }
  }

  var successCallback = function(error, result) {
    console.log("Success Callback", key, result);
    if(args.CallbackUrl) {
      callbackUrlOptions["qs"]["lambda_success"] = "true";
      request(callbackUrlOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log("CallbackUrl Successful. S3-object created", key);
          callback(null, "Done!");
        } else {
          console.log("CallbackUrl failed. But s3-object created", key);
          callback(error);
        }
      })
    } else {
      console.log("S3-object created", key);
      callback(null, "Done!");
    }
  }

  var errorCallback = function(error, result) {
    console.log("Error Callback", key, result);
    if(args.CallbackUrl) {
      callbackUrlOptions["qs"]["lambda_failure"] = "true";
      request(callbackUrlOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log("CallbackUrl Successful. S3-object NOT created", key, result);
          callback(error);
        } else {
          console.log("CallbackUrl NOT Successful. S3-object NOT created", key, result);
          callback(error);
        }
      })
    } else {
      console.log("S3-object NOT created", key, result);
      callback(error);
    }
  }
    
  // Launch the child process
  childProcess.execFile(phantomPath, processArgs, {}, function (error, stdout, stderr) {
    if (error) {
      errorCallback(error, "child process error-1");
      return;
    }
    if (stderr) {
      errorCallback(stderr, "child process error-2");
      return;
    }
    //upload the file to s3
    new AWS.S3().upload({
      Bucket: args.Bucket.Value,
      Key: key,
      ContentType: args.ContentType.Value,
      Body: fs.createReadStream(target)
    }, function (err) {
      // delete the file
      fs.unlink(target, function(err2) {
        if (err) {
          errorCallback(err, "s3 failed");
        } else if (err2) {
          errorCallback(err2, "s3 failed");
        } else {
          // signal done to aws
          successCallback(null, 'Done!');
        }
      });
    });
  });
}
