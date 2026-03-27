from django.urls import path

from jobs.views import (
    JobListView,
    JobDetailView,
    JobCreateView,
    JobAlertListView,
    JobAlertToggleView,
)

urlpatterns = [
    path('', JobListView.as_view(), name='job-list'),
    path('create/', JobCreateView.as_view(), name='job-create'),
    path('alerts/', JobAlertListView.as_view(), name='job-alerts'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/alert/', JobAlertToggleView.as_view(), name='job-alert-toggle'),
]
