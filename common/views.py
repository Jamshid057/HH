from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from candidates.models import CandidateProfile
from companies.models import Company
from common.models import JobRole
from common.serializers import StatisticsSerializer
from jobs.models import Job


@extend_schema(tags=['Common'])
class StatisticsView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        summary='Platforma statistikasi',
        responses={200: StatisticsSerializer},
    )
    def get(self, request):
        data = {
            'total_jobs':       Job.objects.filter(status='active').count(),
            'total_candidates': CandidateProfile.objects.count(),
            'total_companies':  Company.objects.count(),
            'total_job_roles':  JobRole.objects.count(),
        }
        serializer = StatisticsSerializer(data)
        return Response(serializer.data)
