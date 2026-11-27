from django.urls import path

from common.views import (
    ContactCreateView,
    CountryListView,
    EducationListView,
    JobRoleListView,
    PostCategoryView,
    PostDetailView,
    PostListView,
    StatisticsView,
)

urlpatterns = [
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('countries/', CountryListView.as_view(), name='countries'),
    path('educations/', EducationListView.as_view(), name='educations'),
    path('job-roles/', JobRoleListView.as_view(), name='job-roles'),
    path('blog/', PostListView.as_view(), name='blog-list'),
    path('blog/categories/', PostCategoryView.as_view(), name='blog-categories'),
    path('blog/<int:pk>/', PostDetailView.as_view(), name='blog-detail'),
    path('contact/', ContactCreateView.as_view(), name='contact'),
]
