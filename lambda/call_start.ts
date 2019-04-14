import {
    APIGatewayProxyEvent,
    APIGatewayProxyCallback,
    APIGatewayProxyResult
    // @ts-ignore
} from 'aws-lambda'

import CallUtils from '../lambda_util/call_utils'

import config from '../lambda_util/config'

const root_url = process.env.URL + '/.netlify/functions';

exports.handler = async (
    event: APIGatewayProxyEvent,
    context: any,
): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        return CallUtils.return405();
    }

    console.log('Body=' + event.body);
    const callerRaw = CallUtils.getParam(event.body, 'Caller');
    const caller = CallUtils.normalizeCaller(callerRaw);
    console.log('Called from ' + callerRaw);

    await CallUtils.slackReport(CallUtils.buildMessage(config.slack_call_text, { caller }));

    const XML_RECORD = CallUtils.XML_RECORD_START + root_url + config.done_api + CallUtils.XML_RECORD_END;
    const xml = CallUtils.XML_HEADER + CallUtils.buildSayXml(config.call_message) + XML_RECORD + CallUtils.XML_FOOTER;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/xml'
        },
        body: xml
    }
}
