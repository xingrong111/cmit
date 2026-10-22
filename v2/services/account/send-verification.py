import json, os, smtplib, ssl, sys
from email.message import EmailMessage
from email.utils import formataddr

def main():
    data=json.load(sys.stdin)
    message=EmailMessage()
    message['From']=formataddr(('山河有迹',os.environ['MAIL_SENDER_EMAIL']))
    message['To']=data['email']
    message['Subject']='山河有迹｜邮箱注册验证码'
    message.set_content('你的邮箱注册验证码为：'+data['code']+'\n\n验证码5分钟内有效，仅能使用一次。请勿向他人提供验证码。\n如果不是你本人申请，请忽略此邮件。')
    host=os.environ['SMTP_HOST'];port=int(os.environ.get('SMTP_PORT','465'))
    implicit=os.environ.get('SMTP_SECURITY','ssl').lower()=='ssl'
    context=ssl.create_default_context()
    client=smtplib.SMTP_SSL(host,port,timeout=18,context=context) if implicit else smtplib.SMTP(host,port,timeout=18)
    with client:
        if not implicit:
            client.ehlo();client.starttls(context=context);client.ehlo()
        client.login(os.environ['SMTP_USER'],os.environ['SMTP_PASSWORD'])
        client.send_message(message)

if __name__=='__main__':
    try:main()
    except Exception:sys.exit(1)
