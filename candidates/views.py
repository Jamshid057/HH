from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from candidates.models import CandidateProfile, Apply, CandidateWishlist
from candidates.permissions import IsCandidate, IsEmployerOrAdmin
from candidates.serializers import (
    CandidateListSerializer,
    CandidateDetailSerializer,
    CandidateUpdateSerializer,
    CandidateDashboardSerializer,
    AppliedJobSerializer,
    ApplyCreateSerializer,
    WishlistSerializer,
    ChangePasswordSerializer,
)


@extend_schema(tags=['Candidates — Browse'])
class BrowseCandidateView(ListAPIView):
    """Nomzodlar ro'yxati — employer/admin uchun"""
    serializer_class = CandidateListSerializer
    permission_classes = (IsEmployerOrAdmin,)

    @extend_schema(
        summary='Nomzodlar ro\'yxati',
        parameters=[
            OpenApiParameter('experience', str, description='Tajriba: 0-1, 1-2, 2-3, 3-5, 5+'),
            OpenApiParameter('education', str, description='Ta\'lim darajasi'),
            OpenApiParameter('gender', str, description='Jins: male, female, other'),
            OpenApiParameter('candidate_level', str, description='Daraja: entry, mid, senior'),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = CandidateProfile.objects.select_related('user', 'nationality').prefetch_related('educations')
        params = self.request.query_params
        if experience := params.get('experience'):
            qs = qs.filter(experience=experience)
        if education := params.get('education'):
            qs = qs.filter(educations__name__icontains=education)
        if gender := params.get('gender'):
            qs = qs.filter(user__gender=gender)
        if level := params.get('candidate_level'):
            qs = qs.filter(experience=level)
        return qs


@extend_schema(tags=['Candidates — Browse'])
class CandidateDetailView(RetrieveAPIView):
    """Nomzod to'liq profili — employer/admin uchun"""
    serializer_class = CandidateDetailSerializer
    permission_classes = (IsEmployerOrAdmin,)
    queryset = CandidateProfile.objects.select_related('user', 'nationality').prefetch_related(
        'educations', 'user__social_links__social'
    )

    @extend_schema(summary='Nomzod to\'liq profili')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


@extend_schema(tags=['Candidates — Profile'])
class CandidateDashboardView(APIView):
    permission_classes = (IsCandidate,)

    @extend_schema(summary='Candidate dashboard (o\'z statistikasi)')
    def get(self, request):
        try:
            profile = CandidateProfile.objects.get(user=request.user)
        except CandidateProfile.DoesNotExist:
            return Response({'detail': 'Profil topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CandidateDashboardSerializer(profile)
        return Response(serializer.data)


@extend_schema(tags=['Candidates — Profile'])
class CandidateProfileUpdateView(APIView):
    permission_classes = (IsCandidate,)

    @extend_schema(summary='O\'z profilini ko\'rish', responses=CandidateDetailSerializer)
    def get(self, request):
        try:
            profile = CandidateProfile.objects.select_related('user', 'nationality').prefetch_related(
                'educations', 'user__social_links__social'
            ).get(user=request.user)
        except CandidateProfile.DoesNotExist:
            return Response({'detail': 'Profil topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CandidateDetailSerializer(profile)
        return Response(serializer.data)

    @extend_schema(summary='Profilni to\'liq yangilash', request=CandidateUpdateSerializer)
    def put(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateUpdateSerializer(profile, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Profil muvaffaqiyatli yangilandi.'})

    @extend_schema(summary='Profilni qisman yangilash', request=CandidateUpdateSerializer)
    def patch(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Profil muvaffaqiyatli yangilandi.'})


@extend_schema(tags=['Candidates — Jobs'])
class CandidateAppliedJobsView(ListAPIView):
    serializer_class = AppliedJobSerializer
    permission_classes = (IsCandidate,)

    @extend_schema(summary='Murojaat qilingan ishlar ro\'yxati')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return Apply.objects.filter(user=self.request.user).select_related(
            'job', 'job__company'
        ).order_by('-applied_at')


@extend_schema(tags=['Candidates — Jobs'])
class CandidateApplyView(APIView):
    permission_classes = (IsCandidate,)

    @extend_schema(
        summary='Ishga murojaat qilish',
        request=ApplyCreateSerializer,
        responses={201: OpenApiResponse(description='Murojaat yuborildi')},
    )
    def post(self, request):
        serializer = ApplyCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Murojaatingiz yuborildi.'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Candidates — Jobs'])
class CandidateWishlistView(ListAPIView):
    serializer_class = WishlistSerializer
    permission_classes = (IsCandidate,)

    @extend_schema(summary='Saqlangan ishlar (wishlist)')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return CandidateWishlist.objects.filter(user=self.request.user).select_related(
            'job', 'job__company'
        ).order_by('-saved_at')


@extend_schema(tags=['Candidates — Jobs'])
class CandidateWishlistToggleView(APIView):
    permission_classes = (IsCandidate,)

    @extend_schema(
        summary='Ishni wishlistga qo\'shish / o\'chirish (toggle)',
        responses={
            201: OpenApiResponse(description='Wishlistga qo\'shildi'),
            200: OpenApiResponse(description='Wishlistdan o\'chirildi'),
        },
    )
    def post(self, request, job_id):
        wishlist, created = CandidateWishlist.objects.get_or_create(
            user=request.user, job_id=job_id
        )
        if not created:
            wishlist.delete()
            return Response({'message': 'Wishlistdan o\'chirildi.'})
        return Response({'message': 'Wishlistga qo\'shildi.'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Candidates — Profile'])
class CandidateChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Parolni o\'zgartirish',
        request=ChangePasswordSerializer,
    )
    def patch(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Parol muvaffaqiyatli o\'zgartirildi.'})
