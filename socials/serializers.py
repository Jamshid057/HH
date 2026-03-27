from rest_framework import serializers

from socials.models import Social, SocialLink


class SocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Social
        fields = ('id', 'name', 'logo')


class SocialLinkSerializer(serializers.ModelSerializer):
    social_name = serializers.CharField(source='social.name', read_only=True)
    logo = serializers.ImageField(source='social.logo', read_only=True)

    class Meta:
        model = SocialLink
        fields = ('id', 'social', 'social_name', 'logo', 'url')
        extra_kwargs = {'social': {'write_only': True}}


class SocialLinkCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ('id', 'social', 'url')

    def validate(self, attrs):
        request = self.context['request']
        user = request.user

        # user yoki company dan biri bo'lishi kerak
        if not hasattr(user, 'company'):
            attrs['user'] = user
        else:
            attrs['company'] = user.company
            attrs['user'] = user

        return attrs

    def create(self, validated_data):
        return SocialLink.objects.create(**validated_data)
