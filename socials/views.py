from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from socials.models import Social, SocialLink
from socials.serializers import SocialLinkSerializer, SocialLinkCreateUpdateSerializer, SocialSerializer


@extend_schema(tags=['Socials'])
class SocialLinkListCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='O\'zining ijtimoiy havolalari ro\'yxati')
    def get(self, request):
        links = SocialLink.objects.filter(user=request.user).select_related('social')
        serializer = SocialLinkSerializer(links, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary='Yangi ijtimoiy havola qo\'shish',
        request=SocialLinkCreateUpdateSerializer,
        responses={201: OpenApiResponse(description='Havola qo\'shildi')},
    )
    def post(self, request):
        serializer = SocialLinkCreateUpdateSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        link = serializer.save()
        return Response(SocialLinkSerializer(link).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Socials'])
class SocialLinkDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self, pk, user):
        try:
            return SocialLink.objects.get(pk=pk, user=user)
        except SocialLink.DoesNotExist:
            return None

    @extend_schema(
        summary='Ijtimoiy havolani yangilash',
        request=SocialLinkCreateUpdateSerializer,
    )
    def put(self, request, pk):
        link = self.get_object(pk, request.user)
        if not link:
            return Response({'detail': 'Topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SocialLinkCreateUpdateSerializer(
            link, data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SocialLinkSerializer(link).data)

    @extend_schema(summary='Ijtimoiy havolani o\'chirish')
    def delete(self, request, pk):
        link = self.get_object(pk, request.user)
        if not link:
            return Response({'detail': 'Topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Socials'])
class SocialPlatformListView(ListAPIView):
    queryset = Social.objects.order_by('name')
    serializer_class = SocialSerializer
    permission_classes = (AllowAny,)
    pagination_class = None
