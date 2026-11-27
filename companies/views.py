from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from companies.models import Company, SavedCandidate
from companies.permissions import IsEmployer, IsCompanyOwner
from companies.serializers import (
    CompanyListSerializer,
    CompanyDetailSerializer,
    CompanyCreateUpdateSerializer,
    CompanyDashboardSerializer,
    CompanyJobSerializer,
    ApplicantDetailSerializer,
    SavedCandidateSerializer,
    CompanyChangePasswordSerializer,
    ApplicationListSerializer,
    ApplicationStatusSerializer,
)
from candidates.models import CandidateProfile, Apply


@extend_schema(tags=['Companies — Public'])
class TopCompanyView(ListAPIView):
    serializer_class = CompanyListSerializer
    permission_classes = (AllowAny,)

    @extend_schema(
        summary='Top kompaniyalar',
        parameters=[OpenApiParameter('limit', int, description='Nechta qaytarish (default: 8)')],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        limit = int(self.request.query_params.get('limit', 8))
        return Company.objects.prefetch_related('jobs').order_by('-id')[:limit]


@extend_schema(tags=['Companies — Public'])
class CompanyListView(ListAPIView):
    serializer_class = CompanyListSerializer
    permission_classes = (AllowAny,)

    @extend_schema(
        summary='Kompaniyalar ro\'yxati',
        parameters=[
            OpenApiParameter('organization_type', str, description='startup, public, private, ngo'),
            OpenApiParameter('country', str, description='Davlat nomi'),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Company.objects.select_related('country').prefetch_related('jobs').order_by('-id')
        params = self.request.query_params
        if org_type := params.get('organization_type'):
            qs = qs.filter(organization_type=org_type)
        if country := params.get('country'):
            qs = qs.filter(country__name__icontains=country)
        return qs


@extend_schema(tags=['Companies — Public'])
class CompanyPublicDetailView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(summary='Kompaniya profili (public)')
    def get(self, request, pk):
        try:
            company = Company.objects.select_related('country').prefetch_related('social_links__social').get(pk=pk)
        except Company.DoesNotExist:
            return Response({'detail': 'Kompaniya topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyDetailSerializer(company)
        return Response(serializer.data)


@extend_schema(tags=['Companies — Management'])
class CompanyRegisterView(APIView):
    permission_classes = (IsEmployer,)

    @extend_schema(
        summary='Kompaniyani ro\'yxatdan o\'tkazish (employer uchun, bir marta)',
        request=CompanyCreateUpdateSerializer,
        responses={
            201: OpenApiResponse(description='Kompaniya yaratildi'),
            409: OpenApiResponse(description='Allaqachon kompaniya mavjud'),
        },
    )
    def post(self, request):
        if hasattr(request.user, 'company'):
            return Response(
                {'detail': 'Siz allaqachon kompaniya ro\'yxatdan o\'tkazgansiz.'},
                status=status.HTTP_409_CONFLICT
            )
        serializer = CompanyCreateUpdateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        company = serializer.save()
        return Response({'id': company.id, 'message': 'Kompaniya muvaffaqiyatli ro\'yxatdan o\'tdi.'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Companies — Management'])
class CompanyUpdateView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='Kompaniya profilini to\'liq yangilash', request=CompanyCreateUpdateSerializer)
    def put(self, request):
        serializer = CompanyCreateUpdateSerializer(
            request.user.company, data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Kompaniya profili yangilandi.'})

    @extend_schema(summary='Kompaniya profilini qisman yangilash', request=CompanyCreateUpdateSerializer)
    def patch(self, request):
        serializer = CompanyCreateUpdateSerializer(
            request.user.company, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Kompaniya profili yangilandi.'})


@extend_schema(tags=['Companies — Management'])
class CompanyDashboardView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='Kompaniya dashboard (aktiv ishlar, saqlangan nomzodlar soni)')
    def get(self, request):
        serializer = CompanyDashboardSerializer(request.user.company)
        return Response(serializer.data)


@extend_schema(tags=['Companies — Management'])
class CompanyDetailView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='O\'z kompaniya profili (to\'liq)')
    def get(self, request):
        serializer = CompanyDetailSerializer(request.user.company)
        return Response(serializer.data)


@extend_schema(tags=['Companies — Management'])
class CompanyDeleteView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='Kompaniyani o\'chirish')
    def delete(self, request):
        request.user.company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Companies — Jobs'])
class CompanyJobsView(ListAPIView):
    serializer_class = CompanyJobSerializer
    permission_classes = (IsCompanyOwner,)

    @extend_schema(
        summary='Kompaniyaning ish e\'lonlari',
        parameters=[
            OpenApiParameter('job_type', str, description='fulltime, parttime, remote, freelance, internship'),
            OpenApiParameter('status', str, description='active, draft, expired'),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = self.request.user.company.jobs.prefetch_related('applications')
        params = self.request.query_params
        if job_type := params.get('job_type'):
            qs = qs.filter(type=job_type)
        if job_status := params.get('status'):
            qs = qs.filter(status=job_status)
        return qs.order_by('-created_at')


@extend_schema(tags=['Companies — Jobs'])
class CompanyJobApplicantView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='Ish e\'loniga murojaat qilgan nomzod to\'liq ma\'lumoti')
    def get(self, request, job_pk, candidate_pk):
        try:
            profile = CandidateProfile.objects.select_related('user', 'nationality').prefetch_related(
                'educations', 'user__social_links__social'
            ).get(pk=candidate_pk)
        except CandidateProfile.DoesNotExist:
            return Response({'detail': 'Nomzod topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ApplicantDetailSerializer(profile, context={'request': request, 'job_id': job_pk})
        return Response(serializer.data)


@extend_schema(tags=['Companies — Wishlist'])
class SavedCandidateListView(ListAPIView):
    serializer_class = SavedCandidateSerializer
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary='Saqlangan nomzodlar ro\'yxati')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return SavedCandidate.objects.filter(
            company=self.request.user.company
        ).select_related('candidate').order_by('-saved_at')


@extend_schema(tags=['Companies — Wishlist'])
class SavedCandidateToggleView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(
        summary='Nomzodni wishlistga qo\'shish / o\'chirish (toggle)',
        responses={
            201: OpenApiResponse(description='Wishlistga qo\'shildi'),
            200: OpenApiResponse(description='Wishlistdan o\'chirildi'),
        },
    )
    def post(self, request, candidate_pk):
        saved, created = SavedCandidate.objects.get_or_create(
            company=request.user.company,
            candidate_id=candidate_pk
        )
        if not created:
            saved.delete()
            return Response({'message': 'Nomzod wishlistdan o\'chirildi.'})
        return Response({'message': 'Nomzod wishlistga qo\'shildi.'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Companies — Management'])
class CompanyChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Parolni o\'zgartirish', request=CompanyChangePasswordSerializer)
    def patch(self, request):
        serializer = CompanyChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Parol muvaffaqiyatli o\'zgartirildi.'})


@extend_schema(tags=['Companies — Jobs'])
class JobApplicationListView(ListAPIView):
    serializer_class = ApplicationListSerializer
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary="Ish e'loniga kelgan arizalar ro'yxati")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return Apply.objects.filter(
            job_id=self.kwargs['job_pk'], job__company=self.request.user.company
        ).select_related('user', 'user__candidate_profile', 'cv').order_by('-applied_at')


@extend_schema(tags=['Companies — Jobs'])
class JobApplicationStatusView(APIView):
    permission_classes = (IsCompanyOwner,)

    @extend_schema(summary="Ariza statusini o'zgartirish", request=ApplicationStatusSerializer)
    def patch(self, request, job_pk, apply_pk):
        try:
            apply = Apply.objects.get(pk=apply_pk, job_id=job_pk, job__company=request.user.company)
        except Apply.DoesNotExist:
            return Response({'detail': 'Ariza topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ApplicationStatusSerializer(apply, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
