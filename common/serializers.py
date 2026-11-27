from rest_framework import serializers

from common.models import ContactMessage, Country, Education, JobRole, Post


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ('id', 'name')


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ('id', 'name')


class JobRoleSerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = JobRole
        fields = ('id', 'name', 'jobs_count')


class StatisticsSerializer(serializers.Serializer):
    total_jobs = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    total_job_roles = serializers.IntegerField()
    new_jobs = serializers.IntegerField()


class PostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'title', 'category', 'image', 'excerpt', 'author', 'created_at')


class PostDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'title', 'category', 'image', 'excerpt', 'body', 'author', 'created_at')


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ('name', 'email', 'subject', 'message')
