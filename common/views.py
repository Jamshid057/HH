from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from candidates.models import CandidateProfile
from companies.models import Company
from common.models import ContactMessage, Country, Education, JobRole, Post
from common.serializers import (
    ContactMessageSerializer,
    PostDetailSerializer,
    PostListSerializer,
    CountrySerializer,
    EducationSerializer,
    JobRoleSerializer,
    StatisticsSerializer,
)
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
            'new_jobs':         Job.objects.filter(status='active', created_at__date=timezone.now().date()).count(),
        }
        serializer = StatisticsSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Common'])
class CountryListView(ListAPIView):
    queryset = Country.objects.order_by('name')
    serializer_class = CountrySerializer
    permission_classes = (AllowAny,)
    pagination_class = None


@extend_schema(tags=['Common'])
class EducationListView(ListAPIView):
    queryset = Education.objects.order_by('id')
    serializer_class = EducationSerializer
    permission_classes = (AllowAny,)
    pagination_class = None


@extend_schema(tags=['Common'])
class JobRoleListView(ListAPIView):
    """Kategoriyalar — har biri uchun ochiq vakansiyalar soni bilan."""
    serializer_class = JobRoleSerializer
    permission_classes = (AllowAny,)
    pagination_class = None

    def get_queryset(self):
        return JobRole.objects.annotate(
            jobs_count=Count('job', filter=Q(job__status='active'))
        ).order_by('name')


@extend_schema(tags=['Blog'])
class PostListView(ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        qs = Post.objects.all()
        if category := self.request.query_params.get('category'):
            qs = qs.filter(category__iexact=category)
        if q := self.request.query_params.get('search'):
            qs = qs.filter(title__icontains=q)
        return qs


@extend_schema(tags=['Blog'])
class PostDetailView(RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostDetailSerializer
    permission_classes = (AllowAny,)


@extend_schema(tags=['Blog'])
class PostCategoryView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        cats = Post.objects.exclude(category='').values('category').annotate(n=Count('id')).order_by('category')
        return Response([{'name': c['category'], 'count': c['n']} for c in cats])


@extend_schema(tags=['Common'])
class ContactCreateView(CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response({'message': 'Xabaringiz yuborildi.'}, status=status.HTTP_201_CREATED)
