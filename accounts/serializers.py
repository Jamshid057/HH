from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import serializers

from accounts.models import CustomUser
from accounts.utils import get_otp, get_reset_token


class RegisterSerializer(serializers.ModelSerializer):
    conf_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'password', 'conf_password', 'role', 'birth_date')
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['conf_password']:
            raise serializers.ValidationError({'password': 'Parollar mos kelmadi.'})
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop('conf_password')
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError({'error': 'Email yoki parol noto\'g\'ri.'})
        if not user.is_active:
            raise serializers.ValidationError({'error': 'Hisob faol emas.'})
        attrs['user'] = user
        return attrs


# ---------- Email OTP ----------

class SendEmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Bu email ro\'yxatdan o\'tmagan.')
        return value


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        saved_otp = get_otp(attrs['email'])

        if saved_otp is None:
            raise serializers.ValidationError({'code': 'Kod topilmadi yoki muddati o\'tgan.'})
        if saved_otp != attrs['code']:
            raise serializers.ValidationError({'code': 'Kod noto\'g\'ri.'})

        try:
            attrs['user'] = CustomUser.objects.get(email=attrs['email'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({'email': 'Foydalanuvchi topilmadi.'})

        return attrs


# ---------- Google OAuth ----------

class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()
    role = serializers.ChoiceField(choices=['candidate', 'employer'], default='candidate')

    def validate_credential(self, value):
        try:
            info = google_id_token.verify_oauth2_token(
                value,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            raise serializers.ValidationError('Google token noto\'g\'ri yoki muddati o\'tgan.')

        self.google_info = info
        return value

    def validate(self, attrs):
        info = self.google_info
        email = info.get('email')
        first_name = info.get('given_name', '')
        last_name = info.get('family_name', '')

        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': attrs['role'],
                'email_verified': True,
            }
        )

        if created:
            user.set_unusable_password()
            user.save()

        attrs['user'] = user
        return attrs


# ---------- Forgot Password ----------

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Bu email ro\'yxatdan o\'tmagan.')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    conf_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['conf_password']:
            raise serializers.ValidationError({'password': 'Parollar mos kelmadi.'})
        validate_password(attrs['new_password'])

        user_id = get_reset_token(attrs['token'])
        if user_id is None:
            raise serializers.ValidationError({'token': 'Token noto\'g\'ri yoki muddati o\'tgan.'})

        try:
            attrs['user'] = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({'token': 'Foydalanuvchi topilmadi.'})

        return attrs
