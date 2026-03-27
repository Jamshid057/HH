from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from companies.models import Company, SavedCandidate
from common.models import Country
from socials.models import SocialLink, Social
from candidates.models import CandidateProfile, Apply


class SocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Social
        fields = ('id', 'name', 'logo')


class SocialLinkSerializer(serializers.ModelSerializer):
    social_name = serializers.CharField(source='social.name', read_only=True)
    logo = serializers.ImageField(source='social.logo', read_only=True)

    class Meta:
        model = SocialLink
        fields = ('id', 'url', 'social_name', 'logo')


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ('id', 'name')


# ---------- Top / List ----------

class CompanyListSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    job_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = (
            'id', 'name', 'logo', 'organization_type',
            'team_size', 'country', 'job_count',
        )

    def get_job_count(self, obj):
        return obj.jobs.filter(status='active').count()


# ---------- Detail ----------

class CompanyDetailSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    social_links = SocialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = (
            'id', 'name', 'logo', 'banner_image', 'description',
            'country', 'organization_type', 'team_size',
            'establishment_year', 'company_web', 'vision',
            'location', 'phone_number', 'email', 'social_links',
        )


# ---------- Register / Update ----------

class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Company
        fields = (
            'name', 'logo', 'banner_image', 'description',
            'country', 'organization_type', 'team_size',
            'establishment_year', 'company_web', 'vision',
            'location', 'phone_number', 'email',
        )

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


# ---------- Dashboard ----------

class CompanyDashboardSerializer(serializers.ModelSerializer):
    active_job_count = serializers.SerializerMethodField()
    saved_candidate_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ('id', 'name', 'logo', 'active_job_count', 'saved_candidate_count')

    def get_active_job_count(self, obj):
        return obj.jobs.filter(status='active').count()

    def get_saved_candidate_count(self, obj):
        return obj.saved_candidates.count()


# ---------- Company Jobs ----------

class CompanyJobSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    expiration_date = serializers.DateField(read_only=True)
    apply_count = serializers.SerializerMethodField()

    def get_apply_count(self, obj):
        return obj.applications.count()


# ---------- Job Applicant Detail ----------

class ApplicantLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Apply
        fields = ('letter', 'job_id', 'applied_at', 'status')


class ApplicantDetailSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    gender = serializers.CharField(source='user.gender', read_only=True)
    date_of_birth = serializers.DateField(source='user.birth_date', read_only=True)
    marital_status = serializers.CharField(source='user.marital_status', read_only=True)
    nationality = serializers.StringRelatedField(read_only=True)
    educations = serializers.StringRelatedField(many=True, read_only=True)
    social_links = SocialLinkSerializer(source='user.social_links', many=True, read_only=True)
    letters = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = (
            'id', 'fullname', 'title_headline', 'experience',
            'personal_web', 'profile_photo', 'nationality',
            'date_of_birth', 'gender', 'marital_status',
            'biography', 'location', 'phone_number', 'email',
            'educations', 'social_links', 'letters',
        )

    def get_letters(self, obj):
        job_id = self.context.get('job_id')
        applications = Apply.objects.filter(user=obj.user, job_id=job_id)
        return ApplicantLetterSerializer(applications, many=True).data


# ---------- Saved Candidates (Wishlist) ----------

class SavedCandidateSerializer(serializers.ModelSerializer):
    candidate_fullname = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_photo = serializers.SerializerMethodField()
    saved_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = SavedCandidate
        fields = ('id', 'candidate_id', 'candidate_fullname', 'candidate_photo', 'saved_at')

    def get_candidate_photo(self, obj):
        try:
            photo = obj.candidate.candidate_profile.profile_photo
            request = self.context.get('request')
            if photo and request:
                return request.build_absolute_uri(photo.url)
        except Exception:
            pass
        return None


# ---------- Change Password ----------

class CompanyChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({'current_password': 'Joriy parol noto\'g\'ri.'})
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'new_password': 'Parollar mos kelmadi.'})
        validate_password(attrs['new_password'], user)
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
