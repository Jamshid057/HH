from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Job, JobAlert
from jobs.serializers import JobListSerializer, JobDetailSerializer, JobCreateSerializer, JobAlertSerializer


@extend_schema(tags=['Jobs'])
class JobListView(ListAPIView):
    serializer_class = JobListSerializer
    permission_classes = (AllowAny,)

    @extend_schema(
        summary='Ish e\'lonlari ro\'yxati (filter bilan)',
        parameters=[
            OpenApiParameter('promote_type', str, description='featured, urgent, popular'),
            OpenApiParameter('latest', str, description='today, weekly, monthly, all'),
            OpenApiParameter('location', str, description='Shahar nomi'),
            OpenApiParameter('title', str, description='Ish nomi bo\'yicha qidirish'),
            OpenApiParameter('salary', str, description='Maosh oralig\'i: 1000-3000'),
            OpenApiParameter('type', str, description='fulltime, parttime, remote, freelance, internship'),
            OpenApiParameter('education_id', int, description='Ta\'lim ID'),
            OpenApiParameter('experience', str, description='0-1, 1-2, 2-3, 3-5, 5+'),
            OpenApiParameter('salary_type', str, description='monthly, hourly, yearly'),
            OpenApiParameter('job_level', str, description='entry, mid, senior, director, vp'),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Job.objects.select_related(
            'company', 'job_role', 'education'
        ).prefetch_related('applications').filter(status='active')
        params = self.request.query_params

        if promote_type := params.get('promote_type'):
            qs = qs.filter(promote_type=promote_type)
        if latest := params.get('latest'):
            today = timezone.now().date()
            if latest == 'today':
                qs = qs.filter(created_at__date=today)
            elif latest == 'weekly':
                qs = qs.filter(created_at__date__gte=today - timezone.timedelta(days=7))
            elif latest == 'monthly':
                qs = qs.filter(created_at__date__gte=today - timezone.timedelta(days=30))
        if category_id := params.get('category_id'):
            qs = qs.filter(education_id=category_id)
        if location := params.get('location'):
            qs = qs.filter(company__location__icontains=location)
        if title := params.get('title'):
            qs = qs.filter(title__icontains=title)
        if salary := params.get('salary'):
            try:
                min_s, max_s = salary.split('-')
                qs = qs.filter(min_salary__gte=int(min_s), max_salary__lte=int(max_s))
            except (ValueError, AttributeError):
                pass
        if job_type := params.get('type'):
            qs = qs.filter(type=job_type)
        if education_id := params.get('education_id'):
            qs = qs.filter(education_id=education_id)
        if experience := params.get('experience'):
            qs = qs.filter(experience=experience)
        if salary_type := params.get('salary_type'):
            qs = qs.filter(salary_type=salary_type)
        if level := params.get('job_level'):
            qs = qs.filter(level=level)

        return qs.order_by('-created_at')


@extend_schema(tags=['Jobs'])
class JobDetailView(RetrieveAPIView):
    serializer_class = JobDetailSerializer
    permission_classes = (AllowAny,)
    queryset = Job.objects.select_related(
        'company', 'job_role', 'education'
    ).prefetch_related('applications', 'wishlisted_by')

    @extend_schema(summary='Ish e\'loni to\'liq ma\'lumoti')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


@extend_schema(tags=['Jobs'])
class JobCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Yangi ish e\'loni yaratish (employer uchun)',
        request=JobCreateSerializer,
        responses={
            201: OpenApiResponse(description='Ish e\'loni yaratildi'),
            403: OpenApiResponse(description='Kompaniya ro\'yxatdan o\'tmagan'),
        },
    )
    def post(self, request):
        if not hasattr(request.user, 'company'):
            return Response(
                {'detail': 'Avval kompaniyangizni ro\'yxatdan o\'tkazing.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = JobCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        return Response({'id': job.id, 'message': 'Ish e\'loni muvaffaqiyatli yaratildi.'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Jobs — Alerts'])
class JobAlertListView(ListAPIView):
    serializer_class = JobAlertSerializer
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Mening job alertlarim')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return JobAlert.objects.filter(user=self.request.user).select_related(
            'job', 'job__company'
        ).order_by('-alerted_at')


@extend_schema(tags=['Jobs — Alerts'])
class JobAlertToggleView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Job alertni yoqish / o\'chirish (toggle)',
        responses={
            201: OpenApiResponse(description='Alert qo\'shildi'),
            200: OpenApiResponse(description='Alert o\'chirildi'),
        },
    )
    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({'detail': 'Ish e\'loni topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        alert, created = JobAlert.objects.get_or_create(user=request.user, job=job)
        if not created:
            alert.delete()
            return Response({'message': 'Alert o\'chirildi.'})
        return Response({'message': 'Alert qo\'shildi.'}, status=status.HTTP_201_CREATED)
