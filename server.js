/**
 * Firebase Cloud Messaging (FCM) can be used to send messages to clients on iOS, Android and Web.
 *
 * This sample uses FCM to send two types of messages to clients that are subscribed to the `news`
 * topic. One type of message is a simple notification message (display message). The other is
 * a notification message (display notification) with platform specific customizations. For example,
 * a badge is added to messages that are sent to iOS devices.
 */
const https = require('https');
const { google } = require('googleapis');

const PROJECT_ID = 'jomi-baba';
const HOST = 'fcm.googleapis.com';
const PATH = '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

/**
 * Get a valid access token.
 */
// [START retrieve_access_token]
function getAccessToken() {
    return new Promise(function (resolve, reject) {
        const key = require('./jomibaba.json');
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}
// [END retrieve_access_token]

/**
 * Send HTTP request to FCM with given message.
 *
 * @param {object} fcmMessage will make up the body of the request.
 */
function sendFcmMessage(fcmMessage) {
    getAccessToken().then(function (accessToken) {
        const options = {
            hostname: HOST,
            path: PATH,
            method: 'POST',
            // [START use_access_token]
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
            // [END use_access_token]
        };

        const request = https.request(options, function (resp) {
            resp.setEncoding('utf8');
            resp.on('data', function (data) {
                console.log('Message sent to Firebase for delivery, response:');
                console.log(data);
            });
        });

        request.on('error', function (err) {
            console.log('Unable to send message to Firebase');
            console.log(err);
        });

        request.write(JSON.stringify(fcmMessage));
        request.end();
    });
}

/**
 * Construct a JSON object that will be used toheader customize
 * the messages sent to iOS and Android devices.
 */
function buildOverrideMessage() {
    const fcmMessage = buildCommonMessage();
    const apnsOverride = {
        'payload': {
            'aps': {
                'badge': 1
            }
        },
        'headers': {
            //  'apns-priority': '10',
            "apns-push-type": "background",
            "apns-priority": "5", // Must be `5` when `contentAvailable` is set to true.
            "apns-topic": "io.flutter.plugins.firebase.messaging",
        }
    };

    const androidOverride = {
        'notification': {
            'click_action': 'android.intent.action.MAIN'
        }
    };

    fcmMessage['message']['android'] = androidOverride;
    fcmMessage['message']['apns'] = apnsOverride;

    return fcmMessage;
}

/**
 * Construct a JSON object that will be used to define the
 * common parts of a notification message that will be sent
 * to any app instance subscribed to the news topic.
 */
function buildCommonMessage() {
    return {
        'message': {
            'topic': 'all_user',
            'notification': {
                'title': 'FCM Notification',
                'body': 'I hope you enjoyed this post. I will also come up with some more blogs. Have a Nice Day.✌️'
            },
            'data': {
                'title': 'FCM Notification1',
                'message': 'Notification from FCM1',
                'type': 'review'
            }
        }
    };
}

function buildCommonMessage(topic, data) {
    return {
        'message': {
            'topic': topic,
            'notification': {
                'title': data.title,
                'body': data.body
            },
            'data': data
        }
    };
}



const message = process.argv[2];
if (message && message == 'common-message') {
    let data = {
        'title': "hello", 'body': "World",
        "consultantId": "62a45480c2fc102b655f226e", "userId": "6291e0126b08911735300d50",
        route: "review"
    };
    //You must pass this data for consultant review
    const commonMessage = buildCommonMessage("USER.8801878036426", data);
    console.log('FCM request body for message using common notification object:');
    console.log(JSON.stringify(commonMessage, null, 2));
    sendFcmMessage(commonMessage);
} else if (message && message == 'override-message') {
    const overrideMessage = buildOverrideMessage();
    console.log('FCM request body for override message:');
    console.log(JSON.stringify(overrideMessage, null, 2));
    sendFcmMessage(buildOverrideMessage());
} else {
    console.log('Invalid command. Please use one of the following:\n'
        + 'node server.js common-message\n'
        + 'node server.js override-message');
}