import { z } from 'zod';
import { emailMessageSchema, type EmailMessage } from './contracts';

export function emailCorrelationId(requestId: string) {
    return `<webwidgets.${z.uuid().parse(requestId)}@webwidgets.me>`;
}

function encodedSubject(subject: string) {
    // Fold encoded words on code-point boundaries, below RFC 2047's 75-byte limit.
    const chunks: string[] = [];
    let chunk = '';
    for (const character of subject) {
        if (Buffer.byteLength(chunk + character) > 42) {
            chunks.push(chunk);
            chunk = '';
        }
        chunk += character;
    }
    if (chunk) chunks.push(chunk);
    return chunks
        .map((part) => `=?UTF-8?B?${Buffer.from(part).toString('base64')}?=`)
        .join('\r\n ');
}

export function approvedGmailRaw(requestId: string, input: EmailMessage) {
    const message = emailMessageSchema.parse(input);
    const headers = [
        `From: ${message.from}`,
        `To: ${message.to.join(',\r\n ')}`,
        ...(message.cc.length ? [`Cc: ${message.cc.join(',\r\n ')}`] : []),
        ...(message.bcc.length ? [`Bcc: ${message.bcc.join(',\r\n ')}`] : []),
        `Subject: ${encodedSubject(message.subject)}`,
        `Message-ID: ${emailCorrelationId(requestId)}`,
        ...(message.reply
            ? [
                  `In-Reply-To: ${message.reply.inReplyTo}`,
                  `References: ${[...message.reply.references, message.reply.inReplyTo].join('\r\n ')}`,
              ]
            : []),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    const body =
        Buffer.from(message.body)
            .toString('base64')
            .match(/.{1,76}/gu)
            ?.join('\r\n') ?? '';
    return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body}\r\n`).toString(
        'base64url',
    );
}
