from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from candidates.models import CandidateProfile, Resume, Apply, CandidateWishlist
from common.models import Education, Country
from socials.models import SocialLink, Social


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


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ('id', 'name')


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ('id', 'name')


# ---------- Browse (qisqa ko'rinish) ----------

class CandidateListSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(source='user.full_name', read_only=True)
    educations = EducationSerializer(many=True, read_only=True)

    class Meta:
        model = CandidateProfile
        fields = (
            'id', 'user_id', 'fullname', 'title_headline', 'experience',
            'profile_photo', 'educations',
        )


# ---------- Detail (to'liq ko'rinish) ----------

class CandidateDetailSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    gender = serializers.CharField(source='user.gender', read_only=True)
    date_of_birth = serializers.DateField(source='user.birth_date', read_only=True)
    marital_status = serializers.CharField(source='user.marital_status', read_only=True)
    nationality = CountrySerializer(read_only=True)
    educations = EducationSerializer(many=True, read_only=True)
    social_links = SocialLinkSerializer(source='user.social_links', many=True, read_only=True)

    class Meta:
        model = CandidateProfile
        fields = (
            'id', 'user_id', 'fullname', 'title_headline', 'experience',
            'personal_web', 'profile_photo', 'nationality',
            'date_of_birth', 'gender', 'marital_status',
            'biography', 'location', 'phone_number', 'email',
            'educations', 'social_links',
        )


# ---------- Update ----------

class CandidateUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    gender = serializers.ChoiceField(
        source='user.gender',
        choices=['male', 'female', 'other']
    )
    marital_status = serializers.ChoiceField(
        source='user.marital_status',
        choices=['single', 'married', 'divorced', 'widowed']
    )
    date_of_birth = serializers.DateField(source='user.birth_date')
    educations = serializers.PrimaryKeyRelatedField(
        queryset=Education.objects.all(), many=True, required=False
    )
    nationality = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = CandidateProfile
        fields = (
            'first_name', 'last_name', 'email', 'gender', 'marital_status',
            'date_of_birth', 'title_headline', 'experience', 'personal_web',
            'profile_photo', 'nationality', 'biography', 'location',
            'phone_number', 'educations',
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        educations = validated_data.pop('educations', None)

        # User fieldlarini yangilash
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # CandidateProfile fieldlarini yangilash
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if educations is not None:
            instance.educations.set(educations)

        instance.save()
        return instance


# ---------- Dashboard ----------

class CandidateDashboardSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    applied_jobs_count = serializers.SerializerMethodField()
    wishlist_count = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = (
            'fullname', 'email', 'profile_photo',
            'applied_jobs_count', 'wishlist_count',
        )

    def get_applied_jobs_count(self, obj):
        return Apply.objects.filter(user=obj.user).count()

    def get_wishlist_count(self, obj):
        return CandidateWishlist.objects.filter(user=obj.user).count()


# ---------- Applied Jobs ----------

class AppliedJobSerializer(serializers.ModelSerializer):
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    company_logo = serializers.ImageField(source='job.company.logo', read_only=True)

    class Meta:
        model = Apply
        fields = ('job_id', 'title', 'company_name', 'company_logo', 'status', 'applied_at')


# ---------- Apply ----------

class ApplyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Apply
        fields = ('job', 'cv', 'letter')

    def validate(self, attrs):
        user = self.context['request'].user
        if Apply.objects.filter(user=user, job=attrs['job']).exists():
            raise serializers.ValidationError({'job': 'Siz bu ishga allaqachon murojaat qilgansiz.'})
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ---------- Wishlist ----------

class WishlistSerializer(serializers.ModelSerializer):
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    company_logo = serializers.ImageField(source='job.company.logo', read_only=True)

    class Meta:
        model = CandidateWishlist
        fields = ('job_id', 'title', 'company_name', 'company_logo', 'saved_at')


# ---------- Change Password ----------

class ChangePasswordSerializer(serializers.Serializer):
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


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ('id', 'name', 'file')
