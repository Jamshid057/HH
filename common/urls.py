from django.urls import path

from common.views import StatisticsView

urlpatterns = [
    path('statistics/', StatisticsView.as_view(), name='statistics'),
]
