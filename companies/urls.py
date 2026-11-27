from django.urls import path

from companies.views import (
    TopCompanyView,
    CompanyListView,
    CompanyRegisterView,
    CompanyUpdateView,
    CompanyDashboardView,
    CompanyDetailView,
    CompanyPublicDetailView,
    CompanyJobsView,
    CompanyJobApplicantView,
    CompanyDeleteView,
    SavedCandidateListView,
    SavedCandidateToggleView,
    CompanyChangePasswordView,
    JobApplicationListView,
    JobApplicationStatusView,
)

urlpatterns = [
    path('top/', TopCompanyView.as_view(), name='top-companies'),
    path('', CompanyListView.as_view(), name='company-list'),
    path('<int:pk>/', CompanyPublicDetailView.as_view(), name='company-public-detail'),

    path('register/', CompanyRegisterView.as_view(), name='company-register'),
    path('me/', CompanyDetailView.as_view(), name='company-detail'),
    path('me/update/', CompanyUpdateView.as_view(), name='company-update'),
    path('me/delete/', CompanyDeleteView.as_view(), name='company-delete'),
    path('dashboard/', CompanyDashboardView.as_view(), name='company-dashboard'),
    path('jobs/', CompanyJobsView.as_view(), name='company-jobs'),
    path('jobs/<int:job_pk>/applicant/<int:candidate_pk>/', CompanyJobApplicantView.as_view(), name='company-applicant'),
    path('jobs/<int:job_pk>/applications/', JobApplicationListView.as_view(), name='job-applications'),
    path('jobs/<int:job_pk>/applications/<int:apply_pk>/', JobApplicationStatusView.as_view(), name='job-application-status'),
    path('wishlist/', SavedCandidateListView.as_view(), name='saved-candidates'),
    path('wishlist/<int:candidate_pk>/', SavedCandidateToggleView.as_view(), name='saved-candidate-toggle'),
    path('change-password/', CompanyChangePasswordView.as_view(), name='company-change-password'),
]
