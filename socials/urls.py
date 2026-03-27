from django.urls import path

from socials.views import SocialLinkListCreateView, SocialLinkDetailView

urlpatterns = [
    path('', SocialLinkListCreateView.as_view(), name='social-link-list-create'),
    path('<int:pk>/', SocialLinkDetailView.as_view(), name='social-link-detail'),
]
