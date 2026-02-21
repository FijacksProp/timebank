from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Profile
from reviews.models import Review
from sessions_app.models import CreditLedger, Session
from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


DEMO_USERS = [
    ("maria", "Maria Gomez", "America/Mexico_City", "English, Spanish", "Accountant transitioning into UX."),
    ("james", "James Carter", "America/New_York", "English", "Photographer growing into video editing."),
    ("raj", "Raj Malhotra", "America/Chicago", "English, Hindi", "CS student sharpening communication."),
    ("lisa", "Lisa Moreau", "Europe/Paris", "French, English", "Founder learning product design."),
    ("amina", "Amina Yusuf", "Africa/Lagos", "English", "Designer moving into frontend."),
    ("sophie", "Sophie Martin", "Europe/Berlin", "German, English", "Marketer learning analytics."),
    ("diego", "Diego Silva", "America/Sao_Paulo", "Portuguese, English", "Developer exploring brand strategy."),
    ("noah", "Noah Kim", "America/Los_Angeles", "English, Korean", "PM improving technical depth."),
    ("fatima", "Fatima Noor", "Asia/Dubai", "Arabic, English", "Content writer scaling SEO skills."),
    ("leo", "Leo Dupont", "Europe/Paris", "French, English", "Junior dev improving speaking confidence."),
    ("grace", "Grace Wong", "Asia/Singapore", "English, Mandarin", "Analyst learning storytelling."),
    ("sam", "Sam Rivera", "America/Denver", "English, Spanish", "Career switcher into product."),
    ("nina", "Nina Petrova", "Europe/Warsaw", "English, Polish", "UX researcher learning leadership."),
    ("omar", "Omar Hassan", "Africa/Cairo", "Arabic, English", "Sales rep learning python automation."),
    ("hannah", "Hannah Lee", "America/Toronto", "English", "Bootstrapped founder improving copy."),
    ("victor", "Victor Chen", "Asia/Hong_Kong", "English, Cantonese", "Engineer learning design systems."),
    ("eva", "Eva Novak", "Europe/Prague", "English, Czech", "Data analyst growing presentation skills."),
    ("ibrahim", "Ibrahim Bello", "Africa/Lagos", "English", "Backend dev learning product strategy."),
    ("zoe", "Zoe Martin", "America/New_York", "English, French", "Community manager learning SQL."),
    ("kevin", "Kevin Park", "America/Los_Angeles", "English, Korean", "Freelancer learning client sales."),
]

LEVELS = ["beginner", "intermediate", "advanced"]


class Command(BaseCommand):
    help = "Seed 20 demo users, profiles, sessions, credits, and reviews for a busy demo environment."

    @transaction.atomic
    def handle(self, *args, **options):
        self._ensure_skills()
        skills = list(Skill.objects.order_by("id"))
        if len(skills) < 10:
            self.stdout.write(self.style.ERROR("Need at least 10 skills to seed demo users."))
            return

        profiles = []
        password = "Timebank123!"

        for idx, (username, full_name, tz, langs, bio) in enumerate(DEMO_USERS):
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={"email": f"{username}@timebank.demo"},
            )
            user.email = f"{username}@timebank.demo"
            user.set_password(password)
            user.save()

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.full_name = full_name
            profile.bio = bio
            profile.timezone = tz
            profile.languages = langs
            profile.level = LEVELS[idx % len(LEVELS)]
            profile.save()
            profiles.append(profile)

        profile_ids = [p.id for p in profiles]

        # Reset demo-only relations for deterministic seeding.
        ProfileSkillOffered.objects.filter(profile_id__in=profile_ids).delete()
        ProfileSkillWanted.objects.filter(profile_id__in=profile_ids).delete()
        Review.objects.filter(reviewer_id__in=profile_ids).delete()
        Review.objects.filter(reviewee_id__in=profile_ids).delete()
        Session.objects.filter(teacher_id__in=profile_ids).delete()
        Session.objects.filter(learner_id__in=profile_ids).delete()
        CreditLedger.objects.filter(profile_id__in=profile_ids).delete()

        for idx, profile in enumerate(profiles):
            offered = [skills[idx % len(skills)], skills[(idx + 4) % len(skills)]]
            wanted = [skills[(idx + 1) % len(skills)], skills[(idx + 5) % len(skills)]]

            for skill in offered:
                ProfileSkillOffered.objects.create(profile=profile, skill=skill, level=profile.level, years=(idx % 6) + 1)

            for skill in wanted:
                ProfileSkillWanted.objects.create(profile=profile, skill=skill, target_level=profile.level)

            CreditLedger.objects.create(profile=profile, delta=3, reason=CreditLedger.REASON_SIGNUP)

        now = timezone.now()

        # Requested sessions
        requested_count = 0
        accepted_count = 0
        completed_count = 0

        for idx in range(8):
            learner = profiles[idx]
            teacher = profiles[(idx + 1) % len(profiles)]
            skill = learner.wanted_skills.first().skill
            Session.objects.create(
                teacher=teacher,
                learner=learner,
                skill=skill,
                status=Session.STATUS_REQUESTED,
            )
            requested_count += 1

        # Accepted upcoming sessions
        for idx in range(8, 15):
            learner = profiles[idx]
            teacher = profiles[(idx + 2) % len(profiles)]
            skill = learner.wanted_skills.first().skill
            Session.objects.create(
                teacher=teacher,
                learner=learner,
                skill=skill,
                status=Session.STATUS_ACCEPTED,
                scheduled_at=now + timedelta(days=(idx - 6)),
                meeting_link="https://meet.jit.si/timebank-demo",
            )
            accepted_count += 1

        # Completed sessions + credits + reviews
        for idx in range(15, 20):
            learner = profiles[idx]
            teacher = profiles[(idx + 3) % len(profiles)]
            skill = learner.wanted_skills.first().skill
            session = Session.objects.create(
                teacher=teacher,
                learner=learner,
                skill=skill,
                status=Session.STATUS_COMPLETED,
                scheduled_at=now - timedelta(days=(idx - 12)),
                meeting_link="https://meet.jit.si/timebank-demo",
            )

            CreditLedger.objects.create(profile=teacher, delta=1, reason=CreditLedger.REASON_TEACHING, session=session)
            CreditLedger.objects.create(profile=learner, delta=-1, reason=CreditLedger.REASON_LEARNING, session=session)

            Review.objects.create(session=session, reviewer=learner, reviewee=teacher, rating=5, comment="Great session.")
            Review.objects.create(session=session, reviewer=teacher, reviewee=learner, rating=4, comment="Prepared and engaged learner.")
            completed_count += 1

        self.stdout.write(self.style.SUCCESS("Demo seed complete."))
        self.stdout.write(f"Users created/updated: {len(profiles)}")
        self.stdout.write(f"Sessions: requested={requested_count}, accepted={accepted_count}, completed={completed_count}")
        self.stdout.write(f"Demo password for all users: {password}")
        self.stdout.write("Example login: maria / Timebank123!")

    def _ensure_skills(self):
        if Skill.objects.exists():
            return

        # Minimal local fallback if skill catalog was not seeded yet.
        for name in [
            "Python", "Django", "React", "UI Design", "UX Research", "Copywriting", "SEO", "English Speaking",
            "Public Speaking", "Excel", "Data Analysis", "Video Editing", "Photography", "Product Management",
        ]:
            Skill.objects.get_or_create(name=name, defaults={"category": "General"})
