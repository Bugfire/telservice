import {
    APIGatewayProxyEvent,
    APIGatewayProxyCallback,
    APIGatewayProxyResult
    // @ts-ignore
} from 'aws-lambda'

import CallUtils from '../lambda_util/call_utils'

import * as request from 'request-promise';

import config from '../lambda_util/config'

const watson_apikey = process.env.WATSON_API_KEY;
const gdrive_url = process.env.GDRIVE_URL;
const gdrive_key = process.env.GDRIVE_KEY;

async function recognizeRecodingAndStoreToGoogleDrive(caller: string, voiceData: string) {
    if (!CallUtils.isValidString(voiceData)) {
        return;
    }
    try {
        const text = await recognizeRecording(voiceData);
        const share = await storeToGoogleDrive(voiceData, caller);
        await slackReportDone(caller, text, share);
    } catch (ex) {
        console.error('Exception on recognizeRecodingAndStoreToGoogleDrive()');
        console.error(ex);
    }
}

async function storeToGoogleDrive(recording: string, caller: string): Promise<string> {
    if (!CallUtils.isValidString(gdrive_url) || !CallUtils.isValidString(recording)) {
        return null;
    }
    const res: string = await request({
        method: 'GET',
        uri: gdrive_url,
        timeout: 30 * 1000,
        qs: { uri: recording, caller: caller, key: gdrive_key }
    });
    return res;
}

async function slackReportDone(caller: string, text: string, share: string) {
    await CallUtils.slackReport(CallUtils.buildMessage(config.slack_proc_text, {
        caller,
        text: CallUtils.isValidString(text) ? ('\n```\n' + text + '```') : '',
        share: CallUtils.isValidString(share) ? ('<' + share + '|音声>') : '',
    }));
}

async function recognizeRecording(voiceData: string): Promise<string> {
    if (!CallUtils.isValidString(config.watson_url) || !CallUtils.isValidString(voiceData)) {
        return null;
    }
    const resDownload: Buffer = await request({
        method: 'GET',
        uri: voiceData,
        timeout: 30 * 1000,
        encoding: null,
    });
    if (resDownload == null) {
        throw Error('Cannot download wav on ' + voiceData);
    }
    const resUpload: string = await request({
        method: 'POST',
        uri: config.watson_url,
        timeout: 30 * 1000,
        headers: {
            'Content-Type': 'audio/wav',
        },
        auth: {
            user: 'apikey',
            password: watson_apikey,
        },
        body: resDownload,
    });
    const resJson = JSON.parse(resUpload);
    let text = '';
    resJson.results.forEach(v => {
        text += v.alternatives[0].transcript + '\n';
    });
    return text;
}

exports.handler = async (
    event: APIGatewayProxyEvent,
    context: any,
): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        return CallUtils.return405();
    }
    console.log('DUMP - ' + JSON.stringify(event.queryStringParameters));

    const callerRow = event.queryStringParameters['Caller'];
    const voiceData = event.queryStringParameters['RecordingUrl'];
    console.log('Called from ' + callerRow + ' voice on ' + voiceData);

    const caller = CallUtils.normalizeCaller(callerRow);

    await recognizeRecodingAndStoreToGoogleDrive(caller, voiceData);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/plain'
        },
        body: 'done'
    }
}
