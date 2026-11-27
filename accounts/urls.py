from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    RegisterView,
    LoginView,
    SendEmailVerifyView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    GoogleAuthView,
    MeView,
    PreferencesView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('send-email-verify/', SendEmailVerifyView.as_view(), name='send-email-verify'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),

    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    path('me/', MeView.as_view(), name='me'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
]
