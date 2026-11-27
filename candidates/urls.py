from django.urls import path

from candidates.views import (
    BrowseCandidateView,
    CandidateDetailView,
    CandidateDashboardView,
    CandidateProfileUpdateView,
    CandidateAppliedJobsView,
    CandidateApplyView,
    CandidateWishlistView,
    CandidateWishlistToggleView,
    CandidateChangePasswordView,
    ResumeListCreateView,
    ResumeDeleteView,
)

urlpatterns = [
    path('browse/', BrowseCandidateView.as_view(), name='browse-candidates'),
    path('<int:pk>/', CandidateDetailView.as_view(), name='candidate-detail'),
    path('dashboard/', CandidateDashboardView.as_view(), name='candidate-dashboard'),
    path('me/', CandidateProfileUpdateView.as_view(), name='candidate-profile'),
    path('applied-jobs/', CandidateAppliedJobsView.as_view(), name='applied-jobs'),
    path('apply/', CandidateApplyView.as_view(), name='candidate-apply'),
    path('wishlist/', CandidateWishlistView.as_view(), name='candidate-wishlist'),
    path('wishlist/<int:job_id>/', CandidateWishlistToggleView.as_view(), name='wishlist-toggle'),
    path('resumes/', ResumeListCreateView.as_view(), name='resumes'),
    path('resumes/<int:pk>/', ResumeDeleteView.as_view(), name='resume-delete'),
    path('change-password/', CandidateChangePasswordView.as_view(), name='change-password'),
]
