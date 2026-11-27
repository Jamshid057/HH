from rest_framework import serializers

from jobs.models import Job, JobAlert
from common.models import Education, JobRole


class JobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ('id', 'name')


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ('id', 'name')


class CompanyShortSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    logo = serializers.ImageField(read_only=True)
    location = serializers.CharField(read_only=True)


# ---------- List (qisqa) ----------

class JobListSerializer(serializers.ModelSerializer):
    company = CompanyShortSerializer(read_only=True)
    job_role = JobRoleSerializer(read_only=True)
    education = EducationSerializer(read_only=True)
    apply_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'company', 'job_role', 'type',
            'min_salary', 'max_salary', 'salary_type',
            'experience', 'level', 'promote_type',
            'education', 'expiration_date', 'created_at',
            'apply_count',
        )

    def get_apply_count(self, obj):
        return obj.applications.count()


# ---------- Detail (to'liq) ----------

class JobDetailSerializer(serializers.ModelSerializer):
    company = CompanyShortSerializer(read_only=True)
    job_role = JobRoleSerializer(read_only=True)
    education = EducationSerializer(read_only=True)
    apply_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'company', 'job_role',
            'min_salary', 'max_salary', 'salary_type',
            'education', 'experience', 'type', 'vacancy',
            'expiration_date', 'level', 'apply_type',
            'description', 'responsibilities', 'tags',
            'promote_type', 'status', 'created_at',
            'apply_count', 'is_saved',
        )

    def get_apply_count(self, obj):
        return obj.applications.count()

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.wishlisted_by.filter(user=request.user).exists()
        return False


# ---------- Create ----------

class JobCreateSerializer(serializers.ModelSerializer):
    job_role = serializers.PrimaryKeyRelatedField(
        queryset=JobRole.objects.all(), required=False, allow_null=True
    )
    education = serializers.PrimaryKeyRelatedField(
        queryset=Education.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Job
        fields = (
            'title', 'job_role', 'min_salary', 'max_salary', 'salary_type',
            'education', 'experience', 'type', 'vacancy', 'expiration_date',
            'level', 'apply_type', 'description', 'responsibilities',
            'tags', 'promote_type',
        )

    def create(self, validated_data):
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)


# ---------- Alert ----------

class JobAlertSerializer(serializers.ModelSerializer):
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    company_logo = serializers.ImageField(source='job.company.logo', read_only=True)

    class Meta:
        model = JobAlert
        fields = ('id', 'job_id', 'title', 'company_name', 'company_logo', 'alerted_at')


class JobManageSerializer(serializers.ModelSerializer):
    """Faqat e'lon egasi o'zgartira oladigan maydonlar: reklama turi va holati."""

    class Meta:
        model = Job
        fields = ('promote_type', 'status')
