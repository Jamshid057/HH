from rest_framework import serializers

from common.models import Country, Education, JobRole


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ('id', 'name')


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ('id', 'name')


class JobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ('id', 'name')


class StatisticsSerializer(serializers.Serializer):
    total_jobs = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    total_job_roles = serializers.IntegerField()
