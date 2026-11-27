from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import CustomUser
from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    SendEmailVerifySerializer,
    VerifyEmailSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    GoogleAuthSerializer,
)
from accounts.utils import (
    generate_otp,
    generate_reset_token,
    save_otp,
    delete_otp,
    save_reset_token,
    delete_reset_token,
    send_otp_email,
    send_reset_link_email,
)


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    @extend_schema(
        summary='Ro\'yxatdan o\'tish',
        request=RegisterSerializer,
        responses={201: OpenApiResponse(description='Muvaffaqiyatli ro\'yxatdan o\'tildi')},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz.'},
            status=status.HTTP_201_CREATED
        )


@extend_schema(tags=['Auth'])
class LoginView(APIView):
    @extend_schema(
        summary='Kirish (Login)',
        request=LoginSerializer,
        responses={200: OpenApiResponse(description='Access va refresh token qaytariladi')},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
        })


@extend_schema(tags=['Auth — Email tasdiqlash'])
class SendEmailVerifyView(APIView):
    @extend_schema(
        summary='OTP kodni emailga yuborish',
        request=SendEmailVerifySerializer,
        responses={200: OpenApiResponse(description='OTP kod yuborildi (5 daqiqa amal qiladi)')},
    )
    def post(self, request):
        serializer = SendEmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = generate_otp()
        save_otp(email, otp)
        send_otp_email(email, otp)
        return Response({'message': 'Tasdiqlash kodi emailga yuborildi.'})


@extend_schema(tags=['Auth — Email tasdiqlash'])
class VerifyEmailView(APIView):
    @extend_schema(
        summary='OTP kodni tekshirish va emailni tasdiqlash',
        request=VerifyEmailSerializer,
        responses={200: OpenApiResponse(description='Email tasdiqlandi')},
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        email = serializer.validated_data['email']
        user.email_verified = True
        user.save()
        delete_otp(email)
        return Response({'message': 'Email muvaffaqiyatli tasdiqlandi.'})


@extend_schema(tags=['Auth — Parol tiklash'])
class ForgotPasswordView(APIView):
    @extend_schema(
        summary='Parol tiklash havolasini emailga yuborish',
        request=ForgotPasswordSerializer,
        responses={200: OpenApiResponse(description='Reset havola yuborildi (1 soat amal qiladi)')},
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)
        token = generate_reset_token()
        save_reset_token(token, user.id)
        send_reset_link_email(email, token)
        return Response({'message': 'Parolni tiklash havolasi emailga yuborildi.'})


@extend_schema(tags=['Auth'])
class GoogleAuthView(APIView):
    @extend_schema(
        summary='Google orqali kirish / ro\'yxatdan o\'tish',
        request=GoogleAuthSerializer,
        responses={200: OpenApiResponse(description='Access va refresh token qaytariladi')},
    )
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
        })


@extend_schema(tags=['Auth — Parol tiklash'])
class ResetPasswordView(APIView):
    @extend_schema(
        summary='Yangi parol o\'rnatish (token orqali)',
        request=ResetPasswordSerializer,
        responses={200: OpenApiResponse(description='Parol yangilandi')},
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token = serializer.validated_data['token']
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        delete_reset_token(token)
        return Response({'message': 'Parol muvaffaqiyatli yangilandi.'})


PREFERENCE_KEYS = {
    'n_shortlisted', 'n_saved', 'n_expire', 'n_rejected', 'n_alerts',
    'alert_role', 'alert_location', 'profile_public', 'resume_public',
}


@extend_schema(tags=['Auth'])
class PreferencesView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Bildirishnoma va maxfiylik sozlamalari')
    def get(self, request):
        return Response(request.user.preferences or {})

    @extend_schema(summary='Sozlamalarni yangilash (qisman)')
    def patch(self, request):
        data = {k: v for k, v in request.data.items() if k in PREFERENCE_KEYS}
        request.user.preferences = {**(request.user.preferences or {}), **data}
        request.user.save(update_fields=['preferences'])
        return Response(request.user.preferences)


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary="Akkauntni butunlay o'chirish")
    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(summary='Joriy foydalanuvchi ma\'lumoti')
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'email_verified': user.email_verified,
            'has_company': hasattr(user, 'company'),
        })
