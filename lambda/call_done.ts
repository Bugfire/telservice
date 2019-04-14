import {
    APIGatewayProxyEvent,
    APIGatewayProxyCallback,
    APIGatewayProxyResult
    // @ts-ignore
} from 'aws-lambda'

import CallUtils from '../lambda_util/call_utils'

import * as request from 'request-promise';

import config from '../lambda_util/config'

const root_url = process.env.URL + '/.netlify/functions';

exports.handler = async (
    event: APIGatewayProxyEvent,
    context: any,
): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        return CallUtils.return405();
    }

    const callerRow = event.queryStringParameters['Caller'];
    const voiceData = event.queryStringParameters['RecordingUrl'];
    console.log('Called from ' + callerRow + ' voice on ' + voiceData);

    const caller = CallUtils.normalizeCaller(callerRow);
    await CallUtils.slackReport(CallUtils.buildMessage(config.slack_done_text, { caller }));

    const r = await request({
        method: 'POST',
        uri: root_url + config.proc_api,
        timeout: 30 * 1000,
        qs: { Caller: callerRow, RecordingUrl: voiceData }
    });

    const xml = CallUtils.XML_HEADER + CallUtils.buildSayXml(config.done_message) + CallUtils.XML_HANGUP + CallUtils.XML_FOOTER;
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/xml'
        },
        body: xml
    }
}
