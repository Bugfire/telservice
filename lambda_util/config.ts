export default {
    call_api: '/call_start',
    done_api: '/call_done',
    proc_api: '/call_proc',
    slack_call_text: '{caller} から電話着信がありました。',
    slack_done_text: '{caller} から留守番電話の登録がありました。',
    slack_proc_text: '{caller} からの着信 {share}{text}',
    call_message: 'ただいま、電話に出ることができません。:::「ピー」という音の後に60秒以内で、お名前、お電話番号、ご用件のあと、最後にシャープを押してください。',
    done_message: 'お電話ありがとうございました。',
    watson_url: 'https://gateway-tok.watsonplatform.net/speech-to-text/api/v1/recognize?model=ja-JP_NarrowbandModel',
};
