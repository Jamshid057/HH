import random
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def generate_reset_token() -> str:
    return str(uuid.uuid4())


# ---------- Redis key patterns ----------

def otp_key(email: str) -> str:
    return f'otp:{email}'


def reset_key(token: str) -> str:
    return f'reset:{token}'


# ---------- OTP ----------

def save_otp(email: str, otp: str) -> None:
    cache.set(otp_key(email), otp, timeout=settings.OTP_EXPIRE_SECONDS)


def get_otp(email: str):
    return cache.get(otp_key(email))


def delete_otp(email: str) -> None:
    cache.delete(otp_key(email))


# ---------- Reset token ----------

def save_reset_token(token: str, user_id: int) -> None:
    cache.set(reset_key(token), user_id, timeout=settings.RESET_TOKEN_EXPIRE_SECONDS)


def get_reset_token(token: str):
    return cache.get(reset_key(token))


def delete_reset_token(token: str) -> None:
    cache.delete(reset_key(token))


# ---------- Email ----------

def send_otp_email(email: str, otp: str) -> None:
    send_mail(
        subject='Email tasdiqlash kodi — MyJob',
        message=(
            f'Sizning tasdiqlash kodingiz: {otp}\n\n'
            f'Kod {settings.OTP_EXPIRE_SECONDS // 60} daqiqa davomida amal qiladi.\n'
            f'Agar siz bu so\'rovni yubormagan bo\'lsangiz, xabarni e\'tiborsiz qoldiring.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def send_reset_link_email(email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_mail(
        subject='Parolni tiklash — MyJob',
        message=(
            f'Parolni tiklash uchun quyidagi havolani bosing:\n\n'
            f'{reset_url}\n\n'
            f'Havola {settings.RESET_TOKEN_EXPIRE_SECONDS // 60} daqiqa davomida amal qiladi.\n'
            f'Agar siz bu so\'rovni yubormagan bo\'lsangiz, xabarni e\'tiborsiz qoldiring.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
