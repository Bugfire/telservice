import {
    APIGatewayProxyCallback, APIGatewayProxyResult
    // @ts-ignore
} from 'aws-lambda'

import * as request from 'request-promise';

import config from './config';

const slack_webhook_url = process.env.SLACK_WEBHOOK_URL;

class CallUtils {
    static isValidString(obj: string | undefined): boolean {
        return typeof obj === 'string' && obj !== '';
    }
    static normalizeCaller(caller: string | undefined): string {
        if (!this.isValidString(caller)) {
            return '(不明)';
        }
        if (caller.indexOf('+81') === 0) {
            caller = '0' + caller.substr(3);
        }
        return caller;
    }
    static return405(): APIGatewayProxyResult {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }
    static buildMessage(text: string | undefined, keyValue: any): string | null {
        if (!this.isValidString(text)) {
            return null;
        }
        for (const key in keyValue) {
            text = text.split('{' + key + '}').join(keyValue[key]);
        }
        return text;
    }
    static slackReport(message: string | undefined) {
        if (!this.isValidString(slack_webhook_url) || !this.isValidString(message)) {
            console.log(message);
            return;
        }
        try {
            request({
                method: 'POST',
                uri: slack_webhook_url,
                timeout: 30 * 1000,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: message }),
            });
        } catch (ex) {
            console.error('Exception on slackReport()');
            console.error(ex);
        }
    }
    static readonly XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?><Response>';
    static readonly XML_FOOTER = '</Response>';
    static readonly XML_HANGUP = '<Hangup />';
    static readonly XML_RECORD_START = '<Record action="https://';
    static readonly XML_RECORD_END = '" finishOnKey="#" maxLength="60" method="post" timeout="75" />';
    private static readonly XML_SAY_START = '<Say language="ja-jp" voice="woman">';
    private static readonly XML_SAY_END = '</Say>';
    private static readonly XML_SAY_DELIM = '<Pause length="1" />';

    static buildSayXml(message: string): string {
        return message.split(':::').map(v => CallUtils.XML_SAY_START + v + CallUtils.XML_SAY_END).join(CallUtils.XML_SAY_DELIM);
    }
}

export default CallUtils
